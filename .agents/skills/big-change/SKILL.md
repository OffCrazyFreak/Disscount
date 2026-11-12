---
name: big-change
description: Proposes a large research-backed restructure, then carries out only the approved plan in one PR of many reversible commits.
argument-hint: "[what is wrong or what to restructure]"
---

# Big change

Target: $ARGUMENTS

## Gates

1. Edit nothing until I approve the proposal in a question card.
2. The change qualifies only if it fixes something wrong today, removes a cause seen three or more times, or makes a requested change easy. State the payoff as the next change, for example "adding a store touches 5 files now and 1 after". If it does none of these, say so and name the smallest change instead.
3. One PR for one area, with many commits. `/batch` opens many PRs, so it does not fit here.
4. Every commit passes the checks and reverts on its own. Structure and behaviour go in separate commits.
5. Each structure step names the command or test that proves behaviour unchanged, and it passes before and after the step. When none exists, the first commit adds tests that pin today's behaviour.
6. The proposal sets a size budget: estimated churn (lines added plus lines removed) and files, counting planned temporary growth such as a strangler's side-by-side path and the guard. At the end of each step, compare churn so far (`git diff --numstat <base>`) to the estimate; past about 1.5 times churn or files, stop and return to a question card.
7. Opus at medium effort writes the code (`coder`). Sonnet at high effort audits and researches (`researcher`) and reviews (`reviewer`).
8. Anything outside the approved plan goes in the list at the end. A plan that turns out wrong returns to a question card.

## Steps

1. Ground. Read the repository's instructions, then the code and its history (`git log -p`, blame, linked PRs) to learn why it is this way. Measure lines, files and callers. Collect the evidence that it is wrong today: file:line, incidents, how many times it came back.

2. Research. Send `researcher` agents: official docs for the installed versions, code of apps that solved it, people who ran it. Ask each for who disagrees and why.

3. Choose a path. Prefer making the change easy and then making the easy change (Beck, Fowler's preparatory refactoring). Prefer a strangler path, old and new running side by side until the old has no callers, over a big-bang rewrite (Spolsky, Fowler). Keep duplication over an abstraction that needs a flag per caller (Metz).

4. Propose. Write the long version in chat:
   - What is wrong, with the evidence
   - The target, with sources
   - Alternatives rejected and why
   - Size budget: estimated churn and files, with temporary growth and the guard counted, and the expected net lines
   - Ordered reversible steps: each structure step with the command or test that proves behaviour unchanged, each behaviour step with its expected result
   - Risks, data or config steps, and what stays untouched

   Then ask in a card with the main points and your recommendation. Stop until I answer.

5. Record. Open a tracking issue with the why, my decisions, an ordered PR checklist and open questions. Keep a plan file in `~/Documents/<project>/plans/YYYY-MM-DD-topic.md` only when the work spans sessions.

6. Build. Follow the repository's worktree and branch rules. Give each step to a `coder` with its brief, or write it yourself when the steps depend on each other. Run the step's check before and after it.

7. Clean up. Delete what the change made obsolete: the old path, adapters, flags and shims. The PR is not done while the old path has callers. Add a guard against the old pattern growing back (a lint rule, fallow config or test) where one fits, or say why none does.

8. Review. One `reviewer` pass over the whole diff, given the diff, the proposal and its tracking issue, not your conclusions. A second pass only after large fixes.

9. Hand back. The PR body carries the why, my decisions in my words, the research, the commits in review order, what was tested and not run, and the risks. Report churn and files against the budget, net lines, the guard added, and the out-of-plan list with file:line and one sentence each.
