# Preflight and setup

Everything to settle before the review starts, so the run divides work correctly and asks the user as much
as possible up front. Do this in order, then ask Batch A (below) as one `AskUserQuestion`.

## Contents

- Detect the engines and usage
- Choose the branch pair (with an ordering sanity check)
- Choose the scope
- Choose the models and effort (ask every run, recommend from a fresh online check)
- Choose the output format
- Batch A: the one setup question

## Detect the engines and usage

Run `scripts/preflight.sh`. It prints which CLIs are installed and runnable (`coderabbit`, `cursor-agent`, `codex`, `gh`), their versions, and the repo's branches. Never assume every reviewer exists; users differ.

- If an engine is missing, drop it and divide its folders across the engines that remain. Say so, do not silently proceed as if it ran.
- Usage and quota mostly cannot be checked headlessly (CodeRabbit's 3-per-hour limit, Cursor's free quota, Codex token metering are not queryable from the CLI). For those, ask the user whether they still have usage before committing to a split, and design the folder batching to fit the free-tier limits (fewer folders to the scarce engines).
- The Claude reviewer (subagents) has no external CLI and no rate limit; it is always available and seeds the doc first.

## Choose the branch pair (ordering sanity check)

Always ask which branch is under review (the target, the one that is ahead with the new work) and which branch it is reviewed against (the base). Offer the detected local and remote branches from `preflight.sh` so the user picks from real names, not guesses.

Before accepting the pair, validate the ordering:

```bash
git rev-list --left-right --count <base>...<target>   # prints "<behind>  <ahead>"
```

The right shows commits the target has that the base lacks (what will be reviewed). If that count is 0, or the user has clearly swapped them (the branch they named as "under review" is behind the other), warn them: the branch under review must be the one that is ahead and carries the changes, and offer the corrected pair. Do not run a review that would diff nothing or the wrong direction.

## Choose the scope

Recommend a scope from what the engines and usage allow: the branch diff (`base...target`, the usual choice), the whole repo (only for a small repo or a deliberate full audit), or a specific subset of folders. Auto-detected folders come from the diff; the user can narrow them. Keep the scarce engines under their free-tier file limits.

## Choose the models and effort

Never hardcode a model. Every run, do a fresh web search for the current model lineup and the recommended reasoning effort per model, then ask the user which model and effort to use for each available engine (the Claude reviewer, Codex) and for the final consolidation pass. Give a recommendation grounded in that search, but the user decides; their subscription and the model landscape change over time.

Nudge each engine to use its own subagents or parallel workers where it improves coverage: Claude spawns one subagent per feature area, and Codex can review folders in parallel where supported. More independent passes means higher-confidence consensus.

## Choose the output format

Ask whether the consolidated review should be a Markdown doc, a polished standalone HTML page (built with the `frontend-design` skill if one is available, so it is readable rather than generic), or both. HTML is often easier to scan for a long list; Markdown is easier to diff and copy from.

## Batch A: the one setup question

Fold the branch pair, scope, models and effort, and output format into a single `AskUserQuestion` so the user answers once. Which reviewers run is already decided by detection; only confirm that if it is ambiguous. Record every answer before launching Stage 1.
