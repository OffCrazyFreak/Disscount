# Fix protocol

How to implement the findings the user selected. The goal is a clean, reviewable history: one commit per finding, each verified, on a branch that becomes one PR. Plan the work first, then execute it.

## Contents

- Plan mode first
- Follow ALL of AGENTS.md
- Branch setup
- Segmenting the work
- The per-finding loop
- Verifying (the host repo's gate)
- When to use subagents
- Shared-file ordering
- Honesty rules (do not fabricate or silently skip)
- Docs sync (via the document-subsystem skill)
- GitHub issues for the rest
- Closing an issue the fix pass resolved
- Open the PR

## Plan mode first

If the harness supports plan mode, enter it before touching code. Plan the whole fix pass: the file-disjoint groups, their order, which findings share a commit, the docs each group touches, and the push/PR target. Present that plan for approval, then execute. Planning the scope before editing is what keeps the per-finding history clean and avoids mid-run surprises.

## Follow ALL of AGENTS.md

Read the host repo's `AGENTS.md` / `CLAUDE.md` and follow every rule in it closely, not just the ones that seem relevant. Write code like a senior developer on this codebase: reuse existing utils and hooks before adding anything, respect the project's folder structure and naming, keep files small, do not over-comment (comments only for genuinely non-obvious logic or a real decision), and match the surrounding style. The review is only as good as how faithfully the fixes honor the project's own conventions.

## Branch setup

Create the fix branch off the target (integration) branch, matching the user's existing naming (check `git branch` for their pattern):

```bash
git checkout -b fix/ai-<slug>-review-<YYYY-MM> <target>
```

If `reviews/` is not gitignored yet, add it as the first small chore commit so the triage docs never get committed.

## Segmenting the work

Group the selected findings into file-disjoint area batches (auth, forms/modals, backend, a11y, copy, ...). Process batches sequentially in the single working tree so per-finding commit boundaries stay clean and there are no git races. Order areas most-critical first; within a batch, order importance then easiest-first.

## The per-finding loop

For each finding:

1. Read the target file(s). Understand the current behavior before changing it.
2. Make the smallest correct change. Reuse existing utils/hooks; do not invent new code when something fits.
3. Comments are minimal: only for genuinely non-obvious logic or a real decision. Do not narrate the code.
4. Commit it alone, using the AGENTS.md commit format, citing the finding number:

```text
type(scope): Short imperative summary

Changes:
- Specific change 1
- Specific change 2

Brief reason.

Notes:
- Review finding <n> (reviews/REVIEW-<date>-BY-AREA.md)
```

**Never write a review-finding number as `#<n>`.** GitHub auto-links a bare `#12` in a commit message to _issue_ 12 and posts a cross-reference on it, so citing review-doc row numbers that way spams unrelated issues with false backlinks. Write the number plain and name the doc. Use `#<n>` only for a real issue or PR number.

Also note that `Closes #<n>` only auto-closes when the commit lands on the repository's **default** branch. When the PR targets an integration branch (`dev`), the keyword stays inert until that branch merges up, so close the issue manually instead (see below) rather than assuming GitHub did it.

Two findings that are literally the same edit share one commit and cite both IDs. Everything else is its own commit. This is an auto-commit workflow (a standing "never commit unless asked" rule is intentionally suspended for the fix phase, because the user asked for per-finding commits). No `Co-Authored-By` trailer. No em dashes.

## Verifying

Per batch (or per finding for risky ones), run the host repo's own format + typecheck gate before committing, as defined in its `AGENTS.md`. For this repo the gate is:

```bash
cd frontend
pnpm exec prettier --write <changed files>
pnpm exec tsc --noEmit 2>&1 | grep -E "error TS" | grep -vE "PageProps|RouteContext"
```

The grep must print nothing. The `PageProps` / `RouteContext` errors are Next's generated-types noise (produced by `next build` in CI, absent in a standalone `tsc`); they are not yours. The backend is validated by CI (`mvn verify` on H2); do not run `mvn` locally. Be extra careful with Java syntax since it is not locally compiled. If the skill is reused on another repo, swap in that repo's lint/format/typecheck commands.

## When to use subagents

For large, mechanical, well-defined sweeps (a copy sweep, an I-prefix / arrow-to-function pass, a DRY batch, a file move), spawn ONE subagent at a time with precise per-item instructions, have it run the typecheck gate itself, and report per item. Then review its diff and commit. Do not run subagents in parallel worktrees for this: reconciling dozens of per-finding commits across worktrees muddies the clean history the user wants. Keep commits serialized.

## Shared-file ordering

When several findings touch the same file, you cannot cleanly split them into separate commits after the fact. Do those findings strictly edit-then-commit one at a time (commit finding A's change to the shared file before making finding B's change to it). Findings in disjoint files can be edited together and committed per-file from a single verified working tree.

## Honesty rules

These matter more than hitting a finding count:

- If a finding's premise is wrong (for example the backend already enforces the rule, or the code path is unreachable), say so and do the honest in-scope thing instead of fabricating a fix. Tell the user.
- If a finding is already fixed in the current code, note it and make no change.
- If you deliberately defer or skip something the user asked for (for example high-risk file-splits during a stabilization pass), surface it with a recommendation and file an issue. Never silently drop it.

## Docs sync

After a batch, check whether it changed a behavior or invariant that the repo documents under `docs/`. Keep the docs in step:

- If a doc for the affected subsystem exists, update its gotchas / future-improvements surgically (do not rewrite the whole doc).
- If the fix reveals a subsystem with no doc, create a new one. Use the `document-subsystem` skill if one is available; ask the user before adding a brand-new doc.
- Follow the repo's doc conventions (for this repo: no em dashes, one physical line per paragraph/bullet, no hard wrap) and run its markdown formatter (`pnpm exec prettier --write --ignore-path ../.prettierignore "../docs/<file>.md"` from `frontend/`).

## GitHub issues for the rest

For every finding the user excluded (and anything you deferred), file a detailed GitHub issue with `gh`. Do not file issues for things that are intentional by design.

**Use the repo's own issue templates when they exist.** Check `.github/ISSUE_TEMPLATE/` first and pick the template matching the finding (bug, enhancement, tech-debt, and so on). Read that template and compose a `--body-file` that fills every field it asks for instead of inventing your own format, since `gh issue create --template` can drop into an interactive prompt. If the repo has no templates, use the structure below anyway and keep it consistent across the batch.

Write each issue so it is **self-contained**: a maintainer should understand the problem and its current status from the issue alone without opening the codebase, and another agent should be able to pick it up and start work without redoing the analysis. That means:

- **What and where**: `file:line`, with the relevant snippet quoted inline so nobody has to go hunt for it.
- **Current vs expected** behavior, concretely: what happens now, what should happen instead.
- **Why it matters**: the user-visible consequence or risk, not just the rule it breaks.
- **How to test**: the exact before/after check that proves it is fixed.
- **Status and why it is still open**: excluded by the user, deferred as high-risk churn, blocked on an external API, and so on. This is what lets a maintainer triage at a glance.
- **Trail**: the review finding number, plus links to the PR or commits that touched the area.

Apply labels (create `security` / `tech-debt` / `accessibility` if missing). Group tiny leftovers into one checklist issue, but keep each checklist line specific enough to act on by itself.

## Closing an issue the fix pass resolved

Because `Closes #<n>` does not fire from an integration branch, close it yourself and leave a comment that stands on its own:

- The **full 40-character SHA** (short hashes go stale after a rebase) plus the branch and PR it landed in.
- What actually changed structurally: new helpers, where they now live, what got deduplicated.
- **Anything extra you discovered while fixing it** that the issue did not mention. This is the highest-value part; it turns the issue into the record of what was really wrong, not just what was reported.

Cross-link both directions: the issue names the commit, the commit names the finding and the doc.

## Open the PR

1. Final typecheck gate clean.
2. Push the branch (only after the branch/PR target was confirmed with the user, which happens back at Checkpoint 1 so the fix runs unattended to here).
3. `gh pr create --base <target> --head <branch>` with a per-area summary body (write it to a file and use `--body-file`).
4. Confirm CI kicks off. Offer a recap.
