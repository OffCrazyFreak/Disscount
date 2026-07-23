# Review pipeline

How to run the multi-reviewer sweep once preflight (`01-preflight.md`) has settled the branch pair, scope, models, and output format. The external CLIs (CodeRabbit, Cursor, Codex) run in detached background scripts and cost zero Claude budget; the Claude reviewer is the only one Claude drives directly.

## Contents

- Reviewers and roles
- Folder batching (auto-detected, no hardcoded paths)
- Launching the runners
- Monitoring and resuming (15-minute heartbeat)
- Failure-mode gotchas (read before debugging a stuck runner)
- Consolidation into the triage doc

## Reviewers and roles

| Reviewer        | CLI / how                                                                                       | Tier notes                                                               | Role                                       |
| --------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------ |
| CodeRabbit (CR) | `coderabbit review --base <base> --committed --dir <path> --config AGENTS.md`                   | Free: 3 CLI reviews per rolling hour, 150 files/review, public + private | Highest-volume, backend/data/correctness   |
| Cursor (CU)     | `cursor-agent -p "<prompt>" --mode ask --force --output-format text`                            | Free tier, scarce unpublished quota; the challenger                      | Sharp second opinion                       |
| Codex (CX)      | `codex exec -s read-only -c model_reasoning_effort="<effort>" -o <out> "<prompt>" < <difffile>` | Metered by the user's plan                                               | Verifier / consolidator on high-risk areas |
| Claude (CC)     | Claude subagents, one per feature area, driven by Claude directly at the model the user picked  | No external rate limit; the backbone                                     | Broad coverage, seeds the doc first        |

Do not hardcode which model any engine uses. Preflight asked the user per engine, with a recommendation from a fresh online check. Nudge each engine to fan out into its own subagents or parallel workers where it improves coverage (Claude spawns one subagent per area; Codex reviews folders in parallel where supported). Only the engines that `preflight.sh` found are used; divide a missing engine's folders across the rest.

## Folder batching

Diff `<base>...<target>` and take the code-only set (exclude `*.md`, `public/` assets, lockfiles, `*.yaml`). Do not review the whole repo unless the user chose that scope. The runner scripts auto-detect the highest-change folders from the diff via `scripts/_common.sh` (`review_dirs()`), so there are no repo-specific paths baked in; override with the `REVIEW_DIRS` env var when the user narrowed the scope. Keep each scarce engine (Cursor especially) under its free-tier file limits by giving it fewer folders.

## Launching the runners

The runner scripts live in this skill's `scripts/`. They write to `reviews/_review-run/{cr,cursor,codex}/` (under the gitignored `reviews/`), skip any folder that already has a `.done` sentinel, auto-retry on real rate limits, and append `run FINISHED` to their `_STATUS.txt` when done.

```bash
cd <repo-root>
export REVIEW_BASE=<base> REVIEW_TARGET=<target>       # from preflight; TARGET defaults to HEAD
export PATH="$HOME/.cursor/bin:$HOME/.local/bin:$PATH"  # ensure the CLIs resolve
bash .claude/skills/multi-tool-code-review/scripts/run-coderabbit.sh   # background each (run_in_background)
bash .claude/skills/multi-tool-code-review/scripts/run-cursor.sh
bash .claude/skills/multi-tool-code-review/scripts/run-codex.sh
```

Run them with the Bash tool's `run_in_background: true` so they survive across turns and a locked laptop. Meanwhile, spawn one Claude subagent per feature area (each given that area's `git diff <base>...<target> -- <paths>`, the repo's `AGENTS.md` rules, and a fixed output schema) so the Claude half of the doc is ready immediately.

## Monitoring and resuming

Use `scripts/watch-all.sh` (or re-read the status files) to track progress. It emits a heartbeat every 15 minutes by default (set `HEARTBEAT_MIN` to change it) and exits 0 once all present external reviewers show `run FINISHED`, so stalls surface on a predictable cadence. On any new session, re-run the three runner scripts: they skip already-`.done` folders and only pick up what is left, so re-running is how you resume. A crashed runner never false-completes; it just leaves no `.done` for that folder.

## Failure-mode gotchas

Read these before "fixing" a stuck runner; they are the traps this pipeline hit and solved:

- **Detect success by the completion marker only, never by grepping the review text.** The reviewed diff can contain the words `quota`, `429`, `rate limit`, or a commit hash like `4291726`, which falsely tripped rate-limit detection and made runners sleep or loop forever. Success = `grep -q "Review complete"` (CR), `grep -qE '^SEVERITY:|CLEAN'` (Cursor/Codex). Only then write `.done`.
- **CodeRabbit CLI 0.7.0 changed flags:** it is `--committed` (not `--type committed`) and there is no `--plain`. It auto-updates, so re-check the flags if a run suddenly fails.
- **cursor-agent needs `--force`** to bypass the workspace-trust prompt in non-interactive mode.
- **Codex needs `mkdir -p` on its output dir first**, and runs read-only with `-s read-only`.
- **Never `pkill -f 'run-*.sh'` by the plain name;** it matches its own command line and self-kills. Use a bracket glob (`[r]un-...`) or the harness task-stop.
- **Bounded retries only.** Each runner retries a real failure a fixed number of times (sleep ~20m between) and then gives up leaving no `.done`, so a genuinely dead reviewer never spins forever.

## Consolidation into the triage doc

When every present reviewer has finished (all `_STATUS.txt` show `run FINISHED` and the Claude subagents returned), do ONE consolidation pass at the model the user picked for it in preflight:

1. Fold each reviewer's findings into a single list, deduped by `file:line + claim`.
2. Set a consensus column: which of CC / CU / CX / CR flagged each item (more tools = higher confidence).
3. Rank and group per `03-triage-doc-format.md`.
4. Write the consolidated review in the format(s) the user chose (Markdown, HTML, or both). Keep the older per-tool raw output as backing.

The consensus is the point: an item flagged by 3-4 tools independently is trustworthy on sight; a single-tool flag needs a skeptical read (some are false positives, for example a rule the backend already enforces).
