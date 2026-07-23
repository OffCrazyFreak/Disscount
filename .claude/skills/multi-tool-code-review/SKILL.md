---
name: multi-tool-code-review
description: Runs a resumable multi-tool code review of a git branch (CodeRabbit, Cursor, Codex, and Claude subagents), consolidates findings into one ranked triage doc, then drives the chosen fixes to a PR. Use when the user wants to review a branch before merging (for example dev vs main), asks for the multi-tool or multi-model review, wants a consolidated triage doc of findings, or wants to implement and apply review findings as per-finding commits with a PR and GitHub issues.
---

# Multi-tool code review and fix cycle

Reviews a git branch with several independent reviewers, consolidates their findings into one ranked, deduped triage doc, then implements the findings the user picks as one commit each and opens a PR. It runs hands-off between a few human checkpoints, and front-loads the questions so the fix phase can run unattended to the end.

The reference files are numbered in run order: `01-preflight.md`, `02-review-pipeline.md`, `03-triage-doc-format.md`, `04-fix-protocol.md`. Read each when you reach its stage.

## Start here: detect where you are

This cycle spans hours and often several sessions, because the external reviewers are rate-limited. **State lives on disk, not in the conversation.** On every invocation, detect the current stage first and resume from there. Never assume in-memory state.

From the repo root, check:

```bash
ls reviews/_review-run/*/_STATUS.txt 2>/dev/null                     # runner status files
grep -l "run FINISHED" reviews/_review-run/*/_STATUS.txt 2>/dev/null  # which reviewers finished
ls reviews/REVIEW-*-BY-AREA.md 2>/dev/null                           # consolidated triage doc
git branch --list 'fix/*review*'                                     # fix branch
```

Route by what exists:

| State on disk                                          | Go to                                                       |
| ------------------------------------------------------ | ----------------------------------------------------------- |
| No review artifacts                                    | Stage 1 (fresh review), starting with preflight             |
| Runners started, not all reviewers show `run FINISHED` | Stage 1, resume monitoring (re-run the scripts; idempotent) |
| Triage doc exists, no fix branch                       | Checkpoint 1 (present doc, ask Batch B)                     |
| Fix branch exists with commits, no PR                  | Stage 2 (resume fixes) then Stage 3                         |
| PR exists                                              | Stage 3 (monitor CI, recap)                                 |

## Stage 1: Review

Goal: produce the consolidated review in the format the user chose.

1. **Preflight** per `01-preflight.md`: run `scripts/preflight.sh` to detect the installed engines and the branches. Never assume all reviewers exist; divide a missing engine's folders across the rest.
2. **Batch A (one `AskUserQuestion`)**: the branch pair under review + base (validate the ordering, see below), the scope, the model and effort for each available engine and for the consolidation pass, and the output format (Markdown / HTML / both). Do a fresh web search for the current model lineup and recommended effort before recommending; do not hardcode any model.
3. **Run the sweep** per `02-review-pipeline.md`: launch the detached runners in `scripts/` (zero Claude budget) and drive the Claude reviewers yourself in parallel, nudging each engine to fan out into its own subagents where it helps. Monitor with `watch-all.sh` (15-minute heartbeat by default).
4. **Consolidate** once every present reviewer finished: one pass at the user's chosen model into the format(s) from `03-triage-doc-format.md`.

Branch-ordering check: the branch under review must be the one that is ahead and carries the changes. Validate with `git rev-list --left-right --count <base>...<target>`; if the right-hand (ahead) count is 0 or the user swapped the pair, warn them and offer the corrected pair before running.

Budget rule: a full review stays modest as a share of weekly Claude usage. Hitting session limits is fine; the runners are resumable.

## Checkpoint 1: Triage (ask Batch B)

Present the finished review and use `AskUserQuestion` to get everything the fix phase needs, all at once, so Stage 2 runs to the PR without stopping:

- **Which findings to implement.** Recommend the user give the shorter NOT-list (what to skip) rather than enumerate every fix, since the skip list is usually much smaller.
- **The branch to push fixes to / PR target**, recommended from the current repo state (local + remote branches, open PRs). Default: a feature branch to a PR into the integration branch, unless live backend/integration testing needs committing straight to the deploy branch.
- **Any scope decisions the doc flags** (conventions sweep breadth, folder moves, undecided micro-items).

Record the user's explicit NOTs; they override any blanket rule. Do not start fixing until the user has selected.

## Stage 2: Fix

Goal: one commit per finding on a fix branch, verified against the host repo's gate.

Follow `04-fix-protocol.md`. If the harness supports plan mode, enter it first and plan the whole fix pass (groups, order, shared commits, docs, PR target) before editing. Then:

1. Create branch `fix/ai-<slug>-review-<YYYY-MM>` off the target branch, matching the user's existing naming.
2. Closely follow ALL rules in the host repo's `AGENTS.md` / `CLAUDE.md`. Write senior-dev code: reuse existing utils/hooks, respect the folder structure and naming, keep files small, minimal comments.
3. Group findings by file/area; implement each as its own auto-committed commit (AGENTS.md commit format, no `Co-Authored-By`, no em dashes).
4. Run the repo's format + typecheck gate clean before committing a group (this repo: `pnpm exec prettier --write` then `pnpm exec tsc --noEmit`; backend via CI `mvn verify`).
5. For large mechanical sweeps, spawn one subagent at a time; keep commits serialized to avoid git races.
6. Sync docs: update the affected `docs/*` if they exist, or create a new doc via the `document-subsystem` skill (ask before adding a brand-new one).

## Stage 3: Finalize

1. Run the final typecheck gate, push the branch, and open the PR into the target with a per-area summary body.
2. File GitHub issues (labeled) for every finding the user excluded, and for anything you deferred. Surface deferrals with a recommendation; never silently skip.
3. Offer a recap and to watch CI settle.

## Conventions (apply throughout)

- Ask if you are unsure of anything rather than assuming. Follow the host repo's `AGENTS.md` / `CLAUDE.md` closely.
- No em dashes anywhere (chat, docs, commits, comments).
- Do not hardcode any model; ask the user each run and recommend from a fresh online check.
- Frontend gate: `pnpm exec prettier --write <files>` then `pnpm exec tsc --noEmit`. Ignore the known pre-existing `PageProps` / `RouteContext` generated-type errors (they come from Next's typegen, not your changes).
- If `pnpm` is not on PATH, prepend it: `export PATH="$HOME/.local/share/pnpm/bin:$HOME/.local/share/nvm/*/bin:$PATH"`.
- Never run the dev server, a build, or any deploy/Docker command.
- Runner outputs and the triage doc live under `reviews/` (gitignored). Keep them out of commits; `git add` explicit files, never `-A`.
