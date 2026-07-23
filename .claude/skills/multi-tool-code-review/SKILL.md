---
name: multi-tool-code-review
description: Runs a resumable multi-tool code review of a git branch (CodeRabbit, Cursor, Codex, and Claude subagents), consolidates findings into one ranked triage doc, then drives the chosen fixes to a PR. Use when the user wants to review a branch before merging (for example dev vs main), asks for the multi-tool or multi-model review, wants a consolidated triage doc of findings, or wants to implement and apply review findings as per-finding commits with a PR and GitHub issues.
---

# Multi-tool code review and fix cycle

Reviews a git branch with several independent reviewers, consolidates their findings into one ranked, deduped triage doc, then implements the findings the user picks as one commit each and opens a PR. It runs hands-off between a few human checkpoints, and front-loads the questions so the fix phase can run unattended to the end.

The reference files are numbered in run order: `01-preflight.md`, `02-review-pipeline.md`, `03-triage-doc-format.md`, `04-fix-protocol.md`. Read each when you reach its stage.

## Start here: detect state, then confirm intent

This cycle spans hours and often several sessions, because the external reviewers are rate-limited. **State lives on disk, not in the conversation.** On every invocation, detect what is on disk first; never assume in-memory state.

From the repo root, check both the review artifacts and the reviewable targets:

```bash
ls reviews/_review-run/*/_STATUS.txt 2>/dev/null                     # runner status files
grep -l "run FINISHED" reviews/_review-run/*/_STATUS.txt 2>/dev/null  # which reviewers finished
ls reviews/REVIEW-*-BY-AREA.md 2>/dev/null                           # consolidated triage doc
git branch --list 'fix/*review*'                                     # fix branch(es)
bash .claude/skills/multi-tool-code-review/scripts/preflight.sh      # engines, branches, open PRs
```

Then **confirm intent with `AskUserQuestion` before doing anything**, unless the user's request already made it explicit (for example "review PR #38" or "resume the review"). Disk state alone cannot tell you whether the user wants to resume an interrupted cycle or start a brand new review, so ask, with options built from what you detected. When a fix branch or PR exists, offer at least these three as distinct options:

- **Resume** the in-progress cycle. Describe it, for example "resume monitoring the runners", "triage the finished doc", or "keep fixing on `fix/...` and finish PR #NN".
- **Review this branch/PR's own changes** against its base (for example the fix branch or PR #NN head vs its base). Reviewing the fixes you just made is a brand new review, not a resume; offer it explicitly instead of making the user spell it out.
- **Start a new review of a different target.** Preflight (Batch A) then has them pick it: another branch pair, or a different open PR.

A finished or near-finished PR from a previous cycle is NOT automatically the thing to resume. Users routinely re-invoke the skill to review something else: a fresh sweep of a branch, an open PR that was never reviewed, or the diff of the PR they are sitting on. Never silently jump to Stage 3, or to any resume, just because a fix branch or PR exists on disk. When in doubt, ask.

Once the user chooses to resume, this is what each detected state resumes into:

| Detected state                                         | Resume into                                                 |
| ------------------------------------------------------ | ----------------------------------------------------------- |
| Runners started, not all reviewers show `run FINISHED` | Stage 1, resume monitoring (re-run the scripts; idempotent) |
| Triage doc exists, no fix branch                       | Checkpoint 1 (present doc, ask Batch B)                     |
| Fix branch exists with commits, no PR                  | Stage 2 (resume fixes) then Stage 3                         |
| PR exists                                              | Stage 3 (monitor CI, recap)                                 |

If no review artifacts exist at all, skip the resume-versus-new question and go straight to Stage 1 (new review), starting with preflight.

## Stage 1: Review

Goal: produce the consolidated review in the format the user chose.

1. **Preflight** per `01-preflight.md`: run `scripts/preflight.sh` to detect the installed engines, branches, and open PRs, then `scripts/probe-usage.sh` to see which engines still have usage BEFORE asking which to run. Never assume all reviewers exist or that an installed one has quota; divide a missing or exhausted engine's folders across the rest.
2. **Batch A (front-loaded `AskUserQuestion` calls, usually two)** per `01-preflight.md`: what to review (a branch pair or an open PR, options built from the detected branches and `gh pr list`, including the current branch/PR against its base, with the ordering validated, see below); the scope; the output format (Markdown / HTML / both); which engines run (labelled with their probe state); and, as separate questions, the model and effort for the Claude reviewer subagents, for the consolidation pass, and for Codex (model plus effort). Keep the reviewer and consolidation questions separate; do not fold them into one. Build every option from detection, never a free-text target. Do a fresh web search for the current model lineup and recommended effort before recommending; do not hardcode any model.
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
