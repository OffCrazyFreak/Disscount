# Triage doc format

How to structure the consolidated deliverable: one deduped, ranked list the user reads and picks from. It lives under the gitignored `reviews/` (throwaway triage output). The user chose the format in preflight: Markdown (`reviews/REVIEW-<date>-BY-AREA.md`), a standalone HTML page, or both. The structure below is identical in either format; HTML just renders it more readably.

## Contents

- Ordering
- Columns
- Writing the description (be detailed)
- Flagged-by encoding
- Legend block
- Maintainability tail
- Closing line (recommend the NOT-list)
- Formatting and the HTML variant

## Ordering

- ONE list, grouped into areas, areas ordered most to least critical (Security and Auth first, ..., copy and Maintainability last).
- Within an area, rows ordered by importance, then easiest-to-fix (size), then confidence (number of tools that flagged it).
- Number the rows sequentially (1, 2, 3, ...) in that final order, so the user can say "do 1, 7, 12-16".

## Columns

Each area is a table with these columns (full-word headers):

`# | Recommendation | Severity | Importance | Size | Flagged by | Finding | Where | Now / Expected / Test`

- **Recommendation** (your lean-codebase opinion): QUICK (tiny and clearly right), FIX (worth it), CONSIDER (real but a judgment call), SKIP (not worth the churn).
- **Severity**: Critical, Major, Minor, Nitpick.
- **Importance** (impact): sec, data, correctness, UX, a11y, perf, maint.
- **Size**: XS (<=5 lines), S (<=30), M (multi-file or <=2h), L (>2h).
- **Flagged by** (more = higher confidence): the two-letter codes below.
- **Where**: `file:line`.
- **Now / Expected / Test**: current behavior, expected behavior, and how to verify before/after.

## Writing the description

The user often does not know what is actually wrong or why it matters. Make `Finding` and `Now / Expected / Test` genuinely explanatory, not a terse label:

- **Now**: what the code does today and the concrete consequence (the bug it causes, the risk it opens, the confusion it creates), not just "does X".
- **Expected**: what it should do instead, specifically enough to act on.
- **Test**: the exact before/after check (input, click, or command) that shows the fix worked.

This is what lets the user decide and act without opening every file. Terse cells force them back into the code, which defeats the doc.

## Flagged-by encoding

Use two-letter codes so a cell reads like `CC CU CR`:

- **CC** = Claude
- **CU** = Cursor
- **CX** = Codex
- **CR** = CodeRabbit

## Legend block (put near the top of the doc)

```markdown
## Legend

- **Areas** ordered most to least critical. **Rows** ordered importance, then easiest-to-fix, then confidence; **#** runs sequentially.
- **Recommendation**: QUICK / FIX / CONSIDER / SKIP.
- **Severity**: Critical / Major / Minor / Nitpick. **Importance**: sec / data / correctness / UX / a11y / perf / maint.
- **Size**: XS (<=5 lines) / S (<=30) / M / L.
- **Flagged by** (more = higher confidence): **CC**=Claude, **CU**=Cursor, **CX**=Codex, **CR**=CodeRabbit.
```

## Maintainability tail

Collect low-urgency DRY / style / convention items into a final "Maintainability" area with a lighter table (`# | Recommendation | Size | Items`), so they do not drown the substantive findings.

## Closing line

End the doc by telling the user it is easier to name what NOT to fix than what to fix, since the skip list is usually much shorter. For example: "It is usually faster to tell me what to leave out than to list everything to do. Give me the exceptions (for example 'do everything except 12, 30, and all SKIPs in area 6'), or a positive list if you prefer ('1,2,7,10-14'). Each becomes its own commit; we confirm the branch before pushing."

## Formatting and the HTML variant

If prettier is available in the repo, run it on the Markdown so the tables align: `./node_modules/.bin/prettier --write "../reviews/REVIEW-<date>-BY-AREA.md"` from the frontend package. Prettier only checks table syntax, not content, so re-read the rows after any scripted (awk/sed) column edit to catch a swapped cell.

For the HTML variant, build a single self-contained page with the `frontend-design` skill if one is available, so it is a readable, well-typeset document rather than a generic dump. Keep the same areas, columns, legend, and row numbering; the only goal of HTML is easier scanning of a long list. Never send the review to any external host; it stays a local file under `reviews/`.

Self-contained means genuinely self-contained: inline the CSS, use system font stacks, and reference no CDN, webfont, or image. The page is opened over `file://`, often with no network, and anything external renders as a broken document.

### The HTML must follow the system colour scheme

Default to **dark**, and let a light system preference override it. Not the other way round: the user's environment is dark nearly all the time, so dark is the right base and the right fallback when the preference is unknown.

Drive it entirely through CSS custom properties. Declare every colour once in `:root` as dark, then re-declare the same names inside `@media (prefers-color-scheme: light)`. Every rule below references `var(--x)` and never a literal, so the two palettes cannot drift:

```css
:root {
  --bg: #161614;
  --fg: #e8e6e1;
  --line: #2f2d29; /* ...dark is the base... */
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #fbfbfa;
    --fg: #1a1a19;
    --line: #e4e2dd; /* ...light overrides... */
  }
}
@media print {
  :root {
    --bg: #fff;
    --fg: #1a1a19;
    --line: #e4e2dd; /* complete light palette for legible PDF export */
  }
}
```

Severity and recommendation pills need a variable pair each (background and foreground), not one shared set: a light pill background with dark text is unreadable inverted, so the dark palette wants desaturated backgrounds with light text. Do not leave a single hardcoded hex in a rule body.

Verify before handing it over, since a stray literal is invisible until the user's theme flips:

```bash
python3 - <<'PY'
import re

h = open("reviews/<file>.html", encoding="utf-8").read()
style = re.search(r"<style(?:\s[^>]*)?>(.*?)</style>", h, re.IGNORECASE | re.DOTALL)
if not style:
    raise SystemExit("No <style> block found")

css = re.sub(r"/\*.*?\*/", "", style.group(1), flags=re.DOTALL)
rules = re.sub(r"--[\w-]+\s*:\s*[^;{}]+;", "", css)
print("literals left:", re.findall(r"#[0-9a-f]{3,8}\b", rules, re.IGNORECASE) or "none")
PY
```

## Delivering the doc

Give the user the **full absolute path**, on its own line, for every artifact you wrote. Terminal and desktop chat interfaces turn an absolute path into a clickable link, and clicking is how the user actually opens these. A bare filename, a repo-relative path, or a path in prose is not clickable and forces them to reconstruct it.

Get the directory right, not just the name. Reviews are frequently run from a **git worktree**, and `reviews/` is typically gitignored, so the file exists only under the worktree it was written in and no git operation will ever move it. Resolve the real path rather than assuming the user shares your working directory:

```bash
realpath reviews/REVIEW-<date>-<slug>-BY-AREA.html
```

If the repo has a main checkout separate from your worktree, say which copy you are pointing at and note that the worktree copy dies with `git worktree remove`. Offer the `cp` into the main checkout's `reviews/` rather than leaving the user to work it out, and match whatever naming the existing files there already use.

Name files with a slug, not just a date, so they stay distinguishable once several accumulate in one folder: `REVIEW-<date>-<slug>-BY-AREA.md` (for example `REVIEW-2026-08-02-SHOPPING-LIST-SHARING-BY-AREA.md`).
