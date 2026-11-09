---
name: debloat
description: Audits an area for bloat with read-only agents, then removes only what I approved, with behaviour unchanged, in one PR of many commits.
disable-model-invocation: true
argument-hint: "[path or area]"
---

# Debloat

Area: $ARGUMENTS (the whole repository if empty)

## Gates

1. The audit edits nothing. Remove only the entries I approved in a question card.
2. Behaviour stays the same: the same checks pass before and after. A behaviour change is a finding for the list at the end.
3. Every removal has evidence and a one-line proof of why it is dead, such as "no importer: `rg useFoo` finds only its definition", a fallow finding, or "superseded by file:line". Evidence means no references in a search, and the repository's dead code tool where it has one. Also check what a search misses: public URLs, sent emails that link to an asset, reflection, config and framework file conventions. Check open issues, docs and comments for deliberate keeps. An unproven candidate goes in the table marked unconfirmed and is not deleted. Ask me before overriding any CI gate.
4. Net lines must fall. A new abstraction is allowed only when it removes more than it adds. Guards from step 6 are reported on their own line and left out of the net count.
5. One PR for the area, with many commits, one kind of removal per commit.
6. Sonnet at high effort audits (`researcher`). Opus at medium effort removes (`coder`).

## What counts as bloat

- Dead code, unused exports, dependencies, config and assets
- A helper or hook with one caller and no reason to exist apart from it
- A wrapper that only forwards its arguments
- The same knowledge in two places (not code that only looks alike)
- A shared function with a flag or branch per caller: inline it back into its callers (Metz)
- One-off snippets left from an earlier task, and compatibility shims with no remaining caller
- Comments that restate code, stale docs, tests that cannot fail

`/simplify` looks at the current diff only, so it does not replace this audit.

## Steps

1. Baseline. Run the repository's checks and record the results and the baseline commit. Count files and lines per area from the commit, not the worktree, skipping binaries (`-I`), lockfiles and generated files: `git grep -Ic '' <commit> -- <area> ':!:*lock*' ':!:<generated paths>' | awk -F: '{n++; s+=$NF} END {print n, s}'`. A red baseline goes to me before anything else.

2. Audit. Split the area by concern and send one `researcher` per part, in parallel, with the list above. Ask for file:line, the one-line proof, the evidence, net lines, confidence, and the risk if the evidence is wrong. Tell them to read `git log` for each candidate, since code added by a fix may look unused and still guard something.

3. Verify. Check each candidate yourself with a search before listing it, and mark what you cannot confirm as unconfirmed.

4. Ask. Show a table in chat, largest net removal first, grouped by kind, with each entry's one-line proof, and list the guard planned for each kind with its estimated lines. Ask in a card with your recommendation per group, and stop until I answer.

5. Remove. Follow the repository's worktree and branch rules. Give the approved groups to a `coder`, one commit per kind, and run the checks after each.

6. Guard. For each kind removed, add a guard so it cannot grow back (a lint rule, fallow config or test) where one fits, or say why none does.

7. Review. One `reviewer` pass over the diff, asked for anything that still depended on what was removed. A second pass only after large fixes.

8. Hand back. Report lines and files per area before and after (the same count on `HEAD`), the net change from `git diff --numstat <commit> -- <area>` with the same exclusions, which handles deleted files and shows binaries as `-`, the guards added with their lines on their own, checks before and after, what was approved and removed, what was left and why, and the out-of-task list with file:line and one sentence each.
