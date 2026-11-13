// Probe script: test EVERY function in the challenge utils.js against an
// independently written reference implementation, across many inputs
// including edge cases (empty, zero, negative, large, boundary, Unicode).
//
// Usage: node probe.js
// Exits 0. Prints a divergence table; any row where actual !== expected
// (deep-compared) is a candidate bug.

const utils = require('/home/hatch/workspace/aiprove/aiprove-repo/challenges/bug-hunt-utils/utils.js');

// ---- Independent reference implementations (written from first principles) ----
const ref = {
  sum: (a) => a.reduce((t, x) => t + x, 0),
  max: (a) => Math.max(...a),                       // empty -> -Infinity (ambiguous, flagged separately)
  reverse: (s) => [...s].reverse().join(''),        // code-point aware
  isPalindrome: (s) => s === [...s].reverse().join(''),
  factorial: (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; },
  clamp: (x, lo, hi) => Math.min(Math.max(x, lo), hi),
  unique: (a) => [...new Set(a)],
  average: (a) => a.reduce((t, x) => t + x, 0) / a.length,
  titleCase: (s) => s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  countVowels: (s) => (s.match(/[aeiou]/gi) || []).length,
};

const deepEq = (a, b) => {
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  return JSON.stringify(a) === JSON.stringify(b);
};
const show = (v) => (typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v));

// ---- Test matrix: [fn, argsArray, note] ----
const tests = [
  // sum
  ['sum', [[]]], ['sum', [[0]]], ['sum', [[1, 2, 3]]], ['sum', [[-1, 1]]],
  ['sum', [[0.1, 0.2]]], ['sum', [[1e10, 1]]], ['sum', [[-5, -5, 10]]],
  ['sum', [Array.from({ length: 1000 }, (_, i) => i + 1)]],
  // max
  ['max', [[1]]], ['max', [[3, 1, 2]]], ['max', [[-5, -1]]], ['max', [[5, 5]]],
  ['max', [[1.5, 2.5]]], ['max', [[-10, 0, -3]]], ['max', [[]]], // empty: ambiguous spec
  // reverse
  ['reverse', ['']], ['reverse', ['a']], ['reverse', ['abc']], ['reverse', ['racecar']],
  ['reverse', ['hello world']], ['reverse', ['a\u{1F600}b']], ['reverse', ['\u{1F600}']],
  ['reverse', ['\u{1F600}a\u{1F600}']], ['reverse', ['ab\u{1F600}cd']],
  // isPalindrome
  ['isPalindrome', ['racecar']], ['isPalindrome', ['Racecar']], ['isPalindrome', ['a']],
  ['isPalindrome', ['']], ['isPalindrome', ['ab']], ['isPalindrome', ['aba']],
  ['isPalindrome', ['\u{1F600}a\u{1F600}']], ['isPalindrome', ['\u{1F600}\u{1F600}']],
  ['isPalindrome', ['A man a plan a canal Panama']],
  // factorial
  ['factorial', [0]], ['factorial', [1]], ['factorial', [2]], ['factorial', [3]],
  ['factorial', [4]], ['factorial', [5]], ['factorial', [6]], ['factorial', [10]],
  // clamp
  ['clamp', [5, 0, 10]], ['clamp', [-1, 0, 10]], ['clamp', [15, 0, 10]],
  ['clamp', [0, 0, 10]], ['clamp', [10, 0, 10]], ['clamp', [5, 5, 5]],
  ['clamp', [-5, -10, -1]], ['clamp', [2.5, 0, 2]],
  // unique
  ['unique', [[1, 1, 2]]], ['unique', [[]]], ['unique', [['a', 'a', 'b']]],
  ['unique', [[NaN, NaN]]], ['unique', [[1, '1', 1]]], ['unique', [[3, 2, 1, 2, 3]]],
  // average
  ['average', [[1, 2, 3]]], ['average', [[5]]], ['average', [[0.1, 0.2]]],
  ['average', [[-1, 1]]], ['average', [[]]], // empty: 0/0 = NaN in both
  // titleCase
  ['titleCase', ['hello world']], ['titleCase', ['hello-world']],
  ['titleCase', ["don't stop"]], ['titleCase', ["o'brien"]],
  ['titleCase', ['\u00e9lan']], ['titleCase', ['caf\u00e9 au lait']],
  ['titleCase', ['123abc']], ['titleCase', ['hello  world']],
  ['titleCase', ['HELLO WORLD']], ['titleCase', ['hELLO wORLD']],
  ['titleCase', ['a b c']], ['titleCase', ['\u00fcber cool']],
  ['titleCase', ['\u00e9lan vital']],
  // countVowels
  ['countVowels', ['aeiou']], ['countVowels', ['AEIOU']], ['countVowels', ['Hello']],
  ['countVowels', ['HELLO']], ['countVowels', ['AbcE']], ['countVowels', ['bcdfg']],
  ['countVowels', ['AeIoU']], ['countVowels', ['rhythm']], ['countVowels', ['']],
  ['countVowels', ['The quick brown fox']],
];

let divergences = 0;
for (const [fn, args] of tests) {
  const actual = utils[fn](...args);
  const expected = ref[fn](...args);
  const ok = deepEq(actual, expected);
  if (!ok) divergences++;
  console.log(
    `${ok ? 'OK  ' : 'DIFF'} ${fn}(${args.map(show).join(', ')}) => actual=${show(actual)} expected=${show(expected)}`,
  );
}
console.log(`\n${tests.length} cases, ${divergences} divergences.`);
