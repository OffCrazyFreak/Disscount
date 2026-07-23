# Review pipeline

How to run the multi-reviewer sweep once preflight (`01-preflight.md`) has settled the branch pair, scope, models, and output format. The external CLIs (CodeRabbit, Cursor, Codex) run in detached background scripts and cost zero Claude budget; the Claude reviewer is the only one Claude drives directly.

## Contents

- Reviewers and roles
- Folder batching (auto-detected, no hardcoded paths)
- Launching the runners
- Monitoring and resuming (15-minute heartbeat)
- Failure-mode gotchas (read before debugging a stuck runner)
- Consolidation into the triage doc (wait for every reviewer)
- If you present before everything finished
- Late findings after the doc was presented

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

**Always wait for every launched reviewer to finish before consolidating**: all `_STATUS.txt` show `run FINISHED` and every Claude subagent has returned. A slow or rate-limited tail is NOT a reason to go early. CodeRabbit's hourly limit is expected and its runner is resumable, so waiting is the normal cost of the sweep; an hour of waiting is cheaper than a triage doc the user starts acting on while findings are still arriving. "Those folders are small and probably covered by the other engines" is exactly the rationalization to refuse: you cannot know what a reviewer found until it finishes.

The only reviewer you may drop is one that is genuinely dead (out of usage, or it gave up leaving no `.done`). Say so explicitly and name the coverage that is missing.

Then do ONE consolidation pass at the model the user picked for it in preflight:

1. Fold each reviewer's findings into a single list, deduped by `file:line + claim`.
2. Set a consensus column: which of CC / CU / CX / CR flagged each item (more tools = higher confidence).
3. Rank and group per `03-triage-doc-format.md`.
4. Write the consolidated review in the format(s) the user chose (Markdown, HTML, or both). Keep the older per-tool raw output as backing.

The consensus is the point: an item flagged by 3-4 tools independently is trustworthy on sight; a single-tool flag needs a skeptical read (some are false positives, for example a rule the backend already enforces).

## If you present before everything finished

Sometimes the user asks to see the doc early. That is fine, but the partial state must be impossible to miss. Put an explicit **bold** "not final" banner at the top of the doc AND in the chat message, naming which reviewers are still running and which folders they still owe:

```markdown
**NOT FINAL: CodeRabbit is still reviewing `utils/`, `context/`, `backend/`. More findings may still land.**
```

Never present a partial doc as if it were complete, and never bury the caveat in prose or a footnote. State the gap before the findings, not after.

## Late findings after the doc was presented

When a straggler finishes after the user has already seen the doc, do not silently fold its findings in, and do not quietly drop them. Dedupe them against the existing rows first, then **ask the user with `AskUserQuestion` what to do with anything genuinely new**: add it to the current fix scope, file it as an issue, or skip it. If the fix phase is already running, say which batch it would land in and whether it changes anything already committed. The user decides; arriving late is not a reason to quietly widen or narrow the scope they already approved.
