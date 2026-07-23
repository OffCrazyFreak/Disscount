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

If prettier is available in the repo, run it on the Markdown so the tables align: `pnpm exec prettier --write "reviews/REVIEW-<date>-BY-AREA.md"`. Prettier only checks table syntax, not content, so re-read the rows after any scripted (awk/sed) column edit to catch a swapped cell.

For the HTML variant, build a single self-contained page with the `frontend-design` skill if one is available, so it is a readable, well-typeset document rather than a generic dump. Keep the same areas, columns, legend, and row numbering; the only goal of HTML is easier scanning of a long list. Never send the review to any external host; it stays a local file under `reviews/`.
