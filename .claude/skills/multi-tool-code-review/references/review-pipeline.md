# Review pipeline

How to run the four-reviewer sweep and consolidate it. The external CLIs (CodeRabbit, Cursor, Codex) run in detached background scripts and cost zero Claude budget; the Claude/Sonnet reviewer is the only one Claude drives directly.

## Contents

- Reviewers and tiers
- Scope and folder batching
- Launching the runners
- Monitoring and resuming
- Failure-mode gotchas (read before debugging a stuck runner)
- Consolidation into the triage doc

## Reviewers and tiers

| Reviewer             | CLI / how                                                                                     | Tier notes                                                               | Role                                         |
| -------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------- |
| CodeRabbit (CR)      | `coderabbit review --base <base> --committed --dir <path> --config AGENTS.md`                 | Free: 3 CLI reviews per rolling hour, 150 files/review, public + private | Highest-volume, backend/data/correctness     |
| Cursor (CU)          | `cursor-agent -p "<prompt>" --mode ask --force --output-format text`                          | Hobby/Free, scarce unpublished quota; the challenger                     | Sharp second opinion                         |
| Codex (CX)           | `codex exec -s read-only -c model_reasoning_effort="medium" -o <out> "<prompt>" < <difffile>` | ChatGPT Plus, token-metered                                              | Verifier / consolidator on high-risk folders |
| Claude / Sonnet (CS) | Claude subagents, one per feature area, driven by Claude directly                             | No external rate limit; the backbone                                     | Broad coverage, seeds the doc first          |

Effort guidance: Opus never above `xhigh`, Fable never above `high`, Codex/Sonnet at `medium` for breadth and `high` for a deep verify. If the tier or effort is unclear, ask the user before spending budget. Claude cannot query `/usage` headlessly (TUI only), so respect budgets by being frugal, not by measuring.

## Scope and folder batching

Diff `main...<target>` and take the code-only set (exclude `*.md`, `public/` assets, lockfiles, `*.yaml`). Do not review the whole repo; pick the ~10 highest-value folders so each reviewer stays under the free-tier file limits. Batch at `--dir` granularity for CodeRabbit and at feature-area granularity for the Sonnet subagents; both map onto the same areas in the final doc.

Representative high-value folders (adjust per app): `app/(root)` landing, `app/products`, `app/(user)/shopping-lists`, `app/(user)/watchlist`, `app/(user)/digital-cards`, `components/custom`, `components/ui`, `lib`, `hooks`, `backend/src/main/java`.

## Launching the runners

The runner scripts live in this skill's `scripts/`. They write to `reviews/_review-run/{cr,cursor,codex,cc}/` (under the gitignored `reviews/`), are idempotent (skip any folder with a `.done` sentinel), auto-retry on real rate limits, and append `run FINISHED` to their `_STATUS.txt` when done.

```bash
cd <repo-root>
export PATH="$HOME/.cursor/bin:$HOME/.local/bin:$PATH"   # ensure the CLIs resolve
bash .claude/skills/multi-tool-code-review/scripts/run-coderabbit.sh   # background it (run_in_background)
bash .claude/skills/multi-tool-code-review/scripts/run-cursor.sh
bash .claude/skills/multi-tool-code-review/scripts/run-codex.sh
```

Run them with the Bash tool's `run_in_background: true` so they survive across turns and the laptop can be locked. Meanwhile, spawn one Claude/Sonnet subagent per feature area (each given that area's `git diff main...<target> -- <paths>`, the AGENTS.md rules, and a fixed output schema) so the Sonnet half of the doc is ready immediately.

## Monitoring and resuming

Use `scripts/watch-all.sh` (or just re-check the status files) to see progress. On any new session, re-run the three runner scripts: they skip already-`.done` folders and only pick up what is left, so re-running is how you resume. A crashed runner never false-completes; it just leaves no `.done` for that folder.

## Failure-mode gotchas

Read these before "fixing" a stuck runner; they are the traps this pipeline hit and solved:

- **Detect success by the completion marker only, never by grepping the review text.** The reviewed diff can contain the words `quota`, `429`, `rate limit`, or a commit hash like `4291726`, which falsely tripped rate-limit detection and made runners sleep or loop forever. Success = `grep -q "Review complete"` (CR), `grep -qE '^SEVERITY:|CLEAN'` (Codex). Only then write `.done`.
- **CodeRabbit CLI 0.7.0 changed flags:** it is `--committed` (not `--type committed`) and there is no `--plain`. It auto-updates, so re-check the flags if a run suddenly fails.
- **cursor-agent needs `--force`** to bypass the workspace-trust prompt in non-interactive mode.
- **Codex needs `mkdir -p` on its output dir first**, and runs read-only with `-s read-only`.
- **Never `pkill -f 'run-*.sh'` by the plain name;** it matches its own command line and self-kills. Use a bracket glob (`[r]un-...`) or the harness task-stop.
- **Bounded retries only.** Each runner retries a real failure a fixed number of times (sleep ~20m between) and then gives up leaving no `.done`, so a genuinely dead reviewer never spins forever.

## Consolidation into the triage doc

When all four reviewers have finished (all `_STATUS.txt` show `run FINISHED` and the Sonnet subagents returned), do ONE Opus pass:

1. Fold each reviewer's findings into a single list, deduped by `file:line + claim`.
2. Set a consensus column: which of CS / CU / CX / CR flagged each item (more tools = higher confidence).
3. Rank and group per `references/triage-doc-format.md`.
4. Write `reviews/REVIEW-<date>-BY-AREA.md`. Keep the older per-tool raw output as backing.

The four-way consensus is the point: an item flagged by 3-4 tools independently is trustworthy on sight; a single-tool flag needs a skeptical read (some are false positives, for example a rule the backend already enforces).
