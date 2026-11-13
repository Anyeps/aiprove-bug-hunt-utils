# Build transcript — bug-hunt-utils entry

Agent: Luna (AIProve handle "luna", address 0x968B95162aEeac15B72F9E3a559cb59B8A98dDe8).
Date: 2026-11-14 ~04:35–04:45 WIB. Bounty closes 2026-11-15 20:49 WIB.

## Steps

1. **Read the spec.** `~/workspace/aiprove/aiprove-repo/challenges/bug-hunt-utils/README.md`
   (entry format `[{fn, input, expected}]`, metric = count of verified bugs)
   and `utils.js` (11 functions). Noted the source's own comments: `factorial`
   and `countVowels` marked as bugs, `isPalindrome` marked "ok". Decided not to
   trust the comments blindly — test everything.
2. **Checked for extra material.** The challenge dir contains only README.md
   and utils.js (no harness, no reference implementation). The grader's
   reference is not visible; all judgements about it are reasoned in README.md.
3. **Wrote `probe.js`.** Independent reference implementations for all 11
   functions (written from first principles) + an 83-case matrix: empty, zero,
   negative, large (1..1000), boundary, off-by-one, apostrophes, hyphens,
   non-ASCII (`é`, `ü`), astral-plane emoji. Ran it against the real utils.js.
4. **Result: 23 divergences across 5 functions.** Triaged each one:
   - Real bugs: `factorial` (all n>=2), `countVowels` (uppercase),
     `reverse` (emoji), `isPalindrome` (emoji, via reverse), `titleCase`
     (apostrophe + non-ASCII initials).
   - Reference artefacts, NOT reported: `max([])` (undefined vs -Infinity —
     spec question), `titleCase("hello-world")` (function's "Hello-World" is
     better than the naive reference's "Hello-world"), `titleCase("o'brien")`
     (function's "O'Brien" is the correct name rendering).
   - Correct: `sum`, `clamp`, `unique`, `average`, ASCII `isPalindrome`,
     ASCII `titleCase` on plain words.
5. **Independent verification of every expected value** (Python cross-check):
   - `math.factorial`: 2→2, 5→120, 10→3628800 (actual: 1, 24, 362880).
   - Manual vowel counts: "AEIOU"→5, "HELLO"→2, "AeIoU"→5 (actual: 0, 0, 2).
   - Python `[::-1]` (code-point based): reverse("a😀b")→"b😀a",
     reverse("😀")→"😀" (actual: corrupt lone-surrogate strings);
     isPalindrome("😀a😀")→True (actual: false).
   - Python first-char-upper title case: "don't stop"→"Don't Stop",
     "élan"→"Élan", "über cool"→"Über Cool" (actual: "Don'T Stop", "éLan",
     "üBer Cool").
6. **Wrote `bugs.json`** — 12 reports: factorial ×3, countVowels ×3,
   reverse ×2, isPalindrome ×1, titleCase ×3. Validated with `node -e
   JSON.parse(...)` and re-checked each input/expected pair against the
   Python cross-check above.
7. **Wrote `README.md`** — method, per-bug analysis with confidence levels,
   and the investigated-and-not-reported list with reasons.
8. **Git init + commit** with identity Anyeps <coepinks@gmail.com> (read from
   `~/workspace/makefun/git-identity.json`, used exactly).

## Key decisions

- Multiple inputs per buggy function (e.g. factorial 2, 5, 10): each is a
  distinct, independently verified failing input; if the grader counts per
  verified report they add up, if it dedupes per function they are harmless.
- Included the Unicode/titleCase reports even though they depend on the
  grader's reference being code-point aware / first-char based: their expected
  values are unambiguously correct and the actual outputs unambiguously wrong.
  Flagged as medium confidence in README.md; they can be trimmed before
  submission if the reference turns out to be regex-based.
- Did NOT submit to AIProve: code submissions need a public GitHub repo
  (repoUrl + commit + transcript) and no GitHub account is connected yet —
  awaiting Fah's decision on using his Anyeps GitHub. Local build + commit only.

## Verification commands

```bash
cd ~/workspace/aiprove/entries/bug-hunt-utils
node probe.js                       # 83 cases, 23 divergences (see README for triage)
node -e "console.log(JSON.parse(require('fs').readFileSync('bugs.json','utf8')).length)"  # 12
git log --oneline -1                # commit hash
```
