# Runner scripts

Detached, resumable review runners for the three external CLIs. They cost zero Claude budget. The fourth reviewer (Claude / Sonnet) has no script: Claude drives it directly with subagents, one per feature area.

## Usage

Launch each with the Bash tool's `run_in_background: true` so they survive across turns and a locked laptop:

```bash
export REVIEW_BASE=main   # base branch to diff against (default: main)
bash .claude/skills/multi-tool-code-review/scripts/run-coderabbit.sh
bash .claude/skills/multi-tool-code-review/scripts/run-cursor.sh
bash .claude/skills/multi-tool-code-review/scripts/run-codex.sh
```

Monitor with `watch-all.sh` (exits 0 when all three finish, 3 on a 15-min heartbeat).

## Behavior

- Output goes to `reviews/_review-run/{cr,cursor,codex}/` (under the gitignored `reviews/`), so it persists across sessions and stays out of git.
- Each script skips any folder that already has a `.done` sentinel, so re-running is how you resume.
- Success is detected by the completion marker only (`Review complete` for CR, `^SEVERITY:|CLEAN` for Cursor/Codex), never by grepping the review text. Bounded retries (5-6, sleeping 20m) then give up leaving no `.done`.

## Editing

The `DIRS` arrays are tuned to this repo's high-value folders. Adjust them per review scope. Keep CodeRabbit under its free limits (3 reviews/rolling hour, 150 files/review) and keep Cursor's list short (scarce free quota).

## Do not

- `pkill -f 'run-*.sh'` by plain name (it self-kills its own command line). Use the harness task-stop or a bracket glob `[r]un-...`.
