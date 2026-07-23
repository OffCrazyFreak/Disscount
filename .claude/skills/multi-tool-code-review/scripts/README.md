# Runner scripts

Detached, resumable review runners for the external CLIs, plus a preflight probe. They cost zero Claude budget. The Claude reviewer has no script: Claude drives it directly with subagents, one per feature area.

## Preflight

Run this first to see which engines exist and what branches you can review:

```bash
bash .claude/skills/multi-tool-code-review/scripts/preflight.sh
```

It prints which of `coderabbit` / `cursor-agent` / `codex` / `gh` are installed, their versions, and the local + remote branches. Usage and quota are not checkable from the CLI, so ask the user about those. If an engine is missing, drop it and spread its folders across the rest.

## Runners

Launch each with the Bash tool's `run_in_background: true` so they survive across turns and a locked laptop:

```bash
export REVIEW_BASE=main       # base branch to diff against (default: main)
export REVIEW_TARGET=HEAD     # branch under review (default: HEAD, i.e. checked-out branch)
bash .claude/skills/multi-tool-code-review/scripts/run-coderabbit.sh
bash .claude/skills/multi-tool-code-review/scripts/run-cursor.sh
bash .claude/skills/multi-tool-code-review/scripts/run-codex.sh
```

Monitor with `watch-all.sh`: it exits 0 once every reviewer that ran has finished, and exits 3 on a heartbeat (15 minutes by default, set `HEARTBEAT_MIN`) so stalls surface on a known cadence. A reviewer that never ran does not block the exit.

## Folder detection (no hardcoded paths)

`_common.sh` provides `review_dirs()`, which the three runners source. It auto-detects the busiest changed folders from `git diff <base>...<target>`, so nothing repo-specific is baked in. Tune it with env vars:

- `REVIEW_DIRS` - explicit space/newline-separated folder list, skips detection (use when the user narrowed the scope, or to point Codex at the riskiest folders only).
- `REVIEW_DIR_DEPTH` - how many leading path segments define a "folder" (default 4, so a changed file's first 4 segments group it).
- `REVIEW_MAX_DIRS` - cap on folders returned, busiest first (default 12). Lower it for scarce engines like Cursor.
- `REVIEW_CODEX_EFFORT` - Codex `model_reasoning_effort` (default `medium`); set it to the effort the user chose in preflight.

## Behavior

- Output goes to `reviews/_review-run/{cr,cursor,codex}/` (under the gitignored `reviews/`), so it persists across sessions and stays out of git.
- Each script skips any folder that already has a `.done` sentinel, so re-running is how you resume.
- Success is detected by the completion marker only (`Review complete` for CR, `^SEVERITY:|CLEAN` for Cursor/Codex), never by grepping the review text. Bounded retries (5-6, sleeping 20m) then give up leaving no `.done`.
- CodeRabbit and Cursor review the checked-out branch versus `REVIEW_BASE`; check out the target branch before launching them. `REVIEW_TARGET` mainly scopes the diff for folder detection and for Codex.

## Do not

- `pkill -f 'run-*.sh'` by plain name (it self-kills its own command line). Use the harness task-stop or a bracket glob `[r]un-...`.
