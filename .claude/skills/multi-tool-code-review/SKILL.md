---
name: multi-tool-code-review
description: Runs a resumable multi-tool code review of a git branch (CodeRabbit, Cursor, Codex, and Claude subagents), consolidates findings into one ranked triage doc, then drives the chosen fixes to a PR. Use when the user wants to review a branch before merging (for example dev vs main), asks for the multi-tool or four-tool review, wants a consolidated triage doc of findings, or wants to implement and apply review findings as per-finding commits with a PR and GitHub issues.
---

# Multi-tool code review and fix cycle

Reviews a git branch with four independent reviewers, consolidates their findings into one ranked, deduped triage doc, then implements the findings the user picks as one commit each and opens a PR. It runs hands-off between a few human checkpoints (which findings to fix, which branch to push).

## Start here: detect where you are

This cycle spans hours and often several sessions, because the external reviewers are rate-limited. **State lives on disk, not in the conversation.** On every invocation, detect the current stage first and resume from there. Never assume in-memory state.

From the repo root, check:

```bash
ls reviews/_review-run/*/_STATUS.txt 2>/dev/null          # runner status files
grep -l "run FINISHED" reviews/_review-run/*/_STATUS.txt 2>/dev/null   # which reviewers finished
ls reviews/REVIEW-*-BY-AREA.md 2>/dev/null                # consolidated triage doc
git branch --list 'fix/*review*'                          # fix branch
```

Route by what exists:

| State on disk                                          | Go to                                                       |
| ------------------------------------------------------ | ----------------------------------------------------------- |
| No review artifacts                                    | Stage 1 (fresh review)                                      |
| Runners started, not all reviewers show `run FINISHED` | Stage 1, resume monitoring (re-run the scripts; idempotent) |
| Triage doc exists, no fix branch                       | Checkpoint 1 (present doc, ask which findings)              |
| Fix branch exists with commits, no PR                  | Stage 2 (resume fixes) then Stage 3                         |
| PR exists                                              | Stage 3 (monitor CI, recap)                                 |

## Stage 1: Review

Goal: produce `reviews/REVIEW-<date>-BY-AREA.md`.

Follow `references/review-pipeline.md` for the full procedure (reviewer setup, folder batching to fit free-tier limits, the detached runners, and the failure-mode gotchas). Summary:

1. Confirm scope with the user: base branch (usually `main`) and target (usually `dev`); code-only (exclude `*.md`, assets, lockfiles).
2. Detect which reviewers and subscription tiers are available; if the model or effort is unclear, ask the user (Opus never above xhigh, Fable never above high, Codex/Sonnet at medium for breadth).
3. Launch the detached runners in `scripts/` (they use zero Claude budget) and drive the Claude/Sonnet reviewers yourself in parallel.
4. When all four finish, do ONE Opus consolidation pass into the by-area doc using the format in `references/triage-doc-format.md`.

Budget rule: a full review stays under 20% of weekly Claude usage. Hitting session (5h) limits is fine; the runners are resumable.

## Checkpoint 1: Triage (ask the user)

Present the finished `...-BY-AREA.md` and use `AskUserQuestion` to get:

- which findings to implement (by number, by recommendation tier, or by area), and
- any scope decisions the doc flags (conventions sweep breadth, folder moves, undecided micro-items).

Do not start fixing until the user has selected. Record their explicit NOTs; they override any blanket rule.

## Stage 2: Fix

Goal: one commit per finding on a fix branch, prettier + tsc clean.

Follow `references/fix-protocol.md` for the full protocol. Summary:

1. Create branch `fix/ai-<slug>-review-<YYYY-MM>` off the target branch, matching the user's existing branch naming.
2. Group findings by file/area; implement each as its own auto-committed commit (AGENTS.md commit format, no `Co-Authored-By`, no em dashes, minimal comments).
3. `pnpm exec prettier --write` then `pnpm exec tsc --noEmit` must be clean before committing a group. The backend relies on CI (`mvn verify`).
4. For large mechanical sweeps (copy, conventions, DRY batches), spawn one Opus subagent at a time; keep commits serialized to avoid git races.
5. Sync affected `docs/*`. If a fix reveals a subsystem with no doc, ask before creating one (per the `document-subsystem` skill).

## Checkpoint 2: Branch (ask the user, always)

Before any push, ALWAYS ask with `AskUserQuestion` which branch to push to, with a recommendation grounded in the current branch, local + remote branches, and open PRs. Default recommendation: a feature branch to a PR into the integration branch (CI + preview + one reviewable batch), unless live backend/integration testing requires committing straight to the deploy branch.

## Stage 3: Finalize

1. Run a final `tsc` check, push the branch, and open the PR into the target with a per-area summary body.
2. File GitHub issues (labeled) for every finding the user excluded, and for anything you deferred. Surface deferrals with a recommendation; never silently skip.
3. Offer a recap and to watch CI settle.

## Conventions (apply throughout)

- Follow `AGENTS.md` / `CLAUDE.md`: minimal comments (only for genuinely non-obvious logic), I-prefixed interfaces, default exports, `function` declarations, kebab-case files, Croatian informal "ti" and ungendered (company "mi" kept), no em dashes anywhere.
- Frontend gate: `pnpm exec prettier --write <files>` then `pnpm exec tsc --noEmit`. Ignore the known pre-existing `PageProps` / `RouteContext` generated-type errors (they come from Next's typegen, not your changes).
- If `pnpm` is not on PATH, prepend it: `export PATH="$HOME/.local/share/pnpm/bin:$HOME/.local/share/nvm/*/bin:$PATH"`.
- Never run the dev server, a build, or any deploy/Docker command.
- Runner outputs and the triage doc live under `reviews/` (gitignored). Keep them out of commits; `git add` explicit files, never `-A`.
