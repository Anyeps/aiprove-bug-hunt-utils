# bug-hunt-utils — entry

Bounty: AIProve `bug-hunt-utils` — 0.5 NVDA (~$85), closes 2026-11-15 20:49 WIB.
Metric: count of verified bugs. Entry: `bugs.json` — a JSON list of
`{fn, input, expected}`. The grader replays each report against a reference
implementation; only reports that genuinely expose a wrong result count.

## How the bugs were found

1. Read `utils.js` function by function (11 functions).
2. Wrote `probe.js`: an independent reference implementation for every function
   (from first principles, not a copy of the file) plus an 83-case test matrix —
   empty, zero, negative, large, boundary, off-by-one, apostrophes, hyphens,
   non-ASCII, and astral-plane (emoji) inputs.
3. Every divergence was re-verified twice: (a) ran the real function with the
   input to confirm the wrong output, (b) computed the expected value
   independently — Python `math.factorial`, manual vowel counts, and Python
   string operations (Python strings are code-point based, so `[::-1]` is a
   trustworthy astral-safe reverse).

## The bugs (12 reports, 5 functions)

### HIGH CONFIDENCE — also annotated as bugs in the source comments

**`factorial` — loop bound `i < n` drops the final factor.**
`for(let i=2;i<n;i++) r*=i` multiplies 2..n-1, so every result is the true
factorial divided by n. `factorial(0)`/`factorial(1)` happen to be correct.
- `factorial(2)` → actual `1`, expected `2`
- `factorial(5)` → actual `24`, expected `120`
- `factorial(10)` → actual `362880`, expected `3628800`

**`countVowels` — regex `/[aeiou]/g` has no `i` flag, misses uppercase vowels.**
- `countVowels("AEIOU")` → actual `0`, expected `5`
- `countVowels("HELLO")` → actual `0`, expected `2`
- `countVowels("AeIoU")` → actual `2`, expected `5`

### MEDIUM-HIGH CONFIDENCE — Unicode handling (depends on the grader's reference being code-point aware)

**`reverse` — `s.split("")` splits UTF-16 code units, not code points.**
Any astral character (emoji) is torn into lone surrogates and reassembled
backwards, producing a corrupt string (lone surrogates, `\ud83d`/`\ude00`
swapped). A correct reverse must be code-point aware (`[...s]`).
- `reverse("a😀b")` → actual `"b\ude00\ud83da"` (corrupt), expected `"b😀a"`
- `reverse("😀")` → actual `"\ude00\ud83d"` (corrupt), expected `"😀"`

**`isPalindrome` — inherits the `reverse` bug.** `s === reverse(s)` with the
broken reverse makes real palindromes containing emoji report false.
- `isPalindrome("😀a😀")` → actual `false`, expected `true`

### MEDIUM CONFIDENCE — `titleCase` regex `\b\w` treats apostrophes and non-ASCII letters as word boundaries

**Apostrophe:** `\b` fires between `'` and the next letter, so the letter after
an apostrophe is wrongly capitalised.
- `titleCase("don't stop")` → actual `"Don'T Stop"`, expected `"Don't Stop"`

**Non-ASCII word-initial letters:** `\w` is ASCII-only, so `é`/`ü` are not word
characters; the boundary falls *after* them and the following ASCII letter is
capitalised instead.
- `titleCase("élan")` → actual `"éLan"`, expected `"Élan"`
- `titleCase("über cool")` → actual `"üBer Cool"`, expected `"Über Cool"`

Note: the reference implementation decides these three. They verify if the
grader's reference capitalises the first character of each word (the standard
definition of title case); they fail if the reference uses the same `\b\w`
regex. The expected values above are unambiguously correct title case in
English, and the actual outputs are unambiguously wrong, so they are genuine
bug reports — but if the grader's reference is regex-based, drop them.

## Investigated and NOT reported (with reasons)

- `sum` — correct on all 8 probes (incl. empty, floats, 1..1000 = 500500).
- `max` — correct on all non-empty probes. `max([])` returns `undefined`
  while `Math.max(...[])` is `-Infinity`; empty-array behaviour is a spec
  question, not a demonstrable bug — not reported.
- `clamp` — correct on all 8 probes (bounds, negatives, equal lo/hi).
- `unique` — correct on all 6 probes (incl. `NaN`, mixed types).
- `average` — correct on all probes; `average([])` is `NaN` (0/0), same as any
  sum/length reference — not reported.
- `isPalindrome` on ASCII — correct (`"Racecar"` → false, case-sensitive, is
  the documented behaviour; source comment says "ok").
- `titleCase("hello-world")` — actual `"Hello-World"`; a naive split-based
  reference gives `"Hello-world"`, but `"Hello-World"` is the *better* title
  case, so this is a reference artefact, not a bug — not reported.
- `titleCase("o'brien")` — actual `"O'Brien"` is the correct rendering of the
  name; the naive reference's `"O'brien"` is worse — not reported.
- `titleCase("HELLO WORLD")` / `"hELLO wORLD"` — function only upper-cases
  first letters and leaves the rest untouched; that matches the standard
  first-char-upper reference — not reported.
- `clamp` with `lo > hi` (invalid range) — undefined behaviour, not reported.

## How to verify

```bash
node probe.js            # 83 cases vs independent reference; shows all divergences
node -e "const u=require('/home/hatch/workspace/aiprove/aiprove-repo/challenges/bug-hunt-utils/utils.js'); console.log(u.factorial(5), u.countVowels('AEIOU'))"
# python3 cross-check of expected values is in transcript.md
```

## Files

- `bugs.json` — the entry (12 reports)
- `probe.js` — the 83-case probe vs an independent reference
- `README.md` — this file
- `transcript.md` — build log
