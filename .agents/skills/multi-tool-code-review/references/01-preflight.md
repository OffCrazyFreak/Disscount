# Preflight and setup

Everything to settle before the review starts, so the run divides work correctly and asks the user as much
as possible up front. Do this in order, then ask Batch A (below) as one `AskUserQuestion`.

## Contents

- Detect the engines
- Probe remaining usage (before asking which engines to use)
- Choose what to review (branch pair or open PR, with an ordering sanity check)
- Choose the scope
- Choose models and effort per engine (reviewer and consolidation asked separately)
- Choose the output format
- Batch A: the front-loaded setup questions

## Detect the engines

Run `scripts/preflight.sh`. It prints which CLIs are installed and runnable (`coderabbit`, `cursor-agent`, `codex`, `gh`), their versions, and the repo's branches and open PRs. Never assume every reviewer exists; users differ.

- If an engine is missing, drop it and divide its folders across the engines that remain. Say so, do not silently proceed as if it ran.
- The Claude reviewer (subagents) has no external CLI and no rate limit; it is always available and seeds the doc first.

## Probe remaining usage

Installed does not mean usable: an engine can be out of quota right now. Probe BEFORE asking which engines to run, so a dead engine (for example Cursor out of free quota) never gets picked or launched.

Run `scripts/probe-usage.sh`. It fires one trivial throwaway prompt at the cheap-to-probe engines (Cursor, Codex) and reports `usable`, `OUT of usage`, or `unclear`. It deliberately does NOT probe CodeRabbit, because a probe would consume one of its 3 reviews per hour; ask the user about CodeRabbit instead. The probe costs a negligible amount of usage on the engines it does hit.

Feed the result into the engine-selection question: label each option with its probe state (for example "Cursor (appears OUT of usage)"), drop or default-off any engine the probe found exhausted, and still let the user override. This is separate from the runners' own mid-run fail-fast: even a probe-clean engine can run dry partway through, and the runners give up immediately on a terminal usage-limit rather than sleeping through retries.

## Choose what to review (branch pair or open PR)

A review target is EITHER a branch pair OR an open PR. Always offer both as concrete `AskUserQuestion` options built from what `preflight.sh` detected; never ask the user to type a target in free text, and never assume the current branch.

- **A branch pair**: the branch under review (the target, the one that is ahead with the new work) versus a base (for example a full `dev` vs `main` sweep). Build the options from the detected local and remote branches. The current branch versus its integration base (reviewing the fixes you just made) is a common target; offer it explicitly rather than making the user describe it.
- **An open PR**: reviewed as its head versus its base (`gh pr view <n> --json headRefName,baseRefName`). Offer each open PR from the `gh pr list` output as its own option, since an unreviewed PR, or re-reviewing the PR you are sitting on, is a common reason to run the skill.

Before accepting the pair, validate the ordering:

```bash
git rev-list --left-right --count <base>...<target>   # prints "<behind>  <ahead>"
```

The right shows commits the target has that the base lacks (what will be reviewed). If that count is 0, or the user has clearly swapped them (the branch they named as "under review" is behind the other), warn them: the branch under review must be the one that is ahead and carries the changes, and offer the corrected pair. Do not run a review that would diff nothing or the wrong direction.

## Choose the scope

Recommend a scope from what the engines and usage allow: the branch diff (`base...target`, the usual choice), the whole repo (only for a small repo or a deliberate full audit), or a specific subset of folders. Auto-detected folders come from the diff; the user can narrow them. Keep the scarce engines under their free-tier file limits.

## Choose models and effort per engine

Never hardcode a model. Every run, do a fresh web search for the current model lineup and the recommended reasoning effort per model, then recommend from that search but let the user decide; their subscription and the model landscape change over time.

Ask about every knob each present engine actually exposes. Do not ask about only one knob when the engine has two:

- **Claude reviewer subagents**: model AND effort. These are the finders that seed the doc.
- **Consolidation pass**: model AND effort, asked as its OWN separate question, never folded into the reviewer question. The consolidation is the lead pass that dedupes and ranks, usually a stronger model than the finders, so keep the two choices independent (do not offer a single combined "split" toggle).
- **Codex**: model AND effort. The runner passes both (`REVIEW_CODEX_MODEL` as `-m`, `REVIEW_CODEX_EFFORT` as `model_reasoning_effort`), so offer the current Codex model slugs, not just the effort. Missing the model choice is a known past mistake.
- **CodeRabbit and Cursor**: no per-run model flag through the runners; they use the subscription/default model. Nothing to ask beyond whether they run.

Combining a single engine's own model and effort into one option label (for example "Opus 4.8 @ high") is fine; combining two DIFFERENT engines or roles into one question is not.

Nudge each engine to fan out into its own subagents or parallel workers where it improves coverage: Claude spawns one subagent per feature area, and Codex can review folders in parallel where supported. More independent passes means higher-confidence consensus.

## Choose the output format

Ask whether the consolidated review should be a Markdown doc, a polished standalone HTML page (built with the `frontend-design` skill if one is available, so it is readable rather than generic), or both. HTML is often easier to scan for a long list; Markdown is easier to diff and copy from.

## Batch A: the front-loaded setup questions

Ask everything up front, in as few `AskUserQuestion` calls as possible (the tool allows up to four questions per call, so this is usually two calls). Every option is a concrete choice built from detection and the usage probe, never a free-text prompt. A reasonable grouping:

- Call 1: the review target (branch pair or PR), the scope, the output format (Markdown / HTML / both), and which engines run (each labelled with its probe state; drop or default-off any the probe found exhausted).
- Call 2: the per-engine models and effort as separate questions, one each for the Claude reviewer subagents, the consolidation pass, and Codex (model plus effort).

Keep the reviewer and consolidation questions separate, and include the Codex model, not just its effort. Record every answer before launching Stage 1.
