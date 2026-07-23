# Triage doc format

The consolidated deliverable is `reviews/REVIEW-<date>-BY-AREA.md`: one deduped, ranked list the user reads and picks from. It is gitignored (throwaway triage output).

## Ordering

- ONE list, grouped into areas, areas ordered most to least critical (Security and Auth first, ..., Croatian copy and Maintainability last).
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
- **Where**: `file:line` (paths under `frontend/src/` unless prefixed `backend/`).
- **Now / Expected / Test**: current behavior, expected behavior, and how to verify before/after. This is what lets the user act without opening every file.

## Flagged-by encoding

Use two-letter codes so a cell reads like `CS CU CR`:

- **CS** = Claude / Sonnet
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
- **Flagged by** (more = higher confidence): **CS**=Sonnet, **CU**=Cursor, **CX**=Codex, **CR**=CodeRabbit.
```

## Maintainability tail

Collect low-urgency DRY / style / convention items into a final "Maintainability" area with a lighter table (`# | Recommendation | Size | Items`), so they do not drown the substantive findings.

## Closing line

End the doc with an instruction to the user, for example: "Tell me which numbers to implement (for example 'all QUICK + all FIX in areas 1-4', or '1,2,7,10-14'). Each becomes its own commit; we confirm the branch before pushing."

## Formatting

Run `pnpm exec prettier --write "reviews/REVIEW-<date>-BY-AREA.md"` so the tables are aligned. Prettier only checks table syntax, not content, so re-read the rows after any scripted (awk/sed) column edit to catch a swapped cell.
