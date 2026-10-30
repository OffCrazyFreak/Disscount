---
name: research
description: Researches implementation and product decisions before coding. Use when the user asks to research, investigate, compare approaches, verify current behavior, or find best practices, or when a nontrivial change depends on current external facts. Inspects the codebase, official documentation, maintained libraries, comparable products, and primary sources. Skip trivial edits and approved decisions unless new uncertainty arises.
---

# Research

Find enough current evidence to make a sound decision before implementation. Follow the user's scope and the applicable project instructions. The user's instructions take precedence over this skill.

## Choose the mode

Infer the intended mode from the request.

- **Research only:** Investigate and report. Do not edit application files, install dependencies, or implement. Write a report file only when requested.
- **Research then implement:** Research first and state the decision before changing code. Continue with the authorized work when no unresolved product choice remains.
- **Advice or review:** Research the facts needed for the answer, then respond without expanding the task.

## Workflow

1. Read the applicable instructions. Inspect the relevant code, dependencies, configuration, and internal documentation. Search for an existing solution to the same problem.
2. Identify the questions that could change the decision. Separate discoverable facts from product preferences that only the user can settle. Preserve approved decisions unless a new fact or constraint makes them doubtful.
3. Use web research when the user requests it or the answer depends on current libraries, APIs, standards, products, prices, policies, or reported behavior.
4. Start with current primary sources. Prefer official documentation, specifications, release notes, and maintained source repositories. Follow project rules for documentation tools.
5. Open and read the supporting pages. Do not rely on search snippets, generated summaries, or remembered API details.
6. Add maintained alternatives, comparable products, issue trackers, and practitioner discussions when they help. Treat anecdotes as reports. Look for credible contradictory evidence before a consequential recommendation.
7. Compare realistic options against the criteria that matter here. These may include compatibility, maintenance, license, security, accessibility, performance, cost, and migration effort. Omit irrelevant criteria.
8. Prefer an existing installed capability when it fits. Prefer a maintained library over custom code when it provides the same behavior without an unacceptable tradeoff. Challenge unsupported assumptions and mention adjacent fixes only when they could change the result.
9. Match depth to the decision. Honor a requested source count or depth. Otherwise stop when new sources repeat established findings and remaining uncertainty would not change the recommendation.

If required evidence is inaccessible, identify the exact gap and explain how it limits the conclusion.

## Report the result

Lead with the recommendation and the reason it wins for this project. Then provide:

- the evidence that determines the choice, with direct links near supported claims;
- realistic alternatives and their material tradeoffs;
- unresolved gaps or product decisions;
- a short implementation outline when it helps assess the recommendation.

Distinguish verified facts, source claims, and inference. Check dates and versions when recency matters. Keep the report proportional to the decision. Do not bury the answer in a source diary or claim certainty beyond the evidence.

For research-only requests, stop after the report. For authorized implementation work, continue at the settled scope and cite the relevant research in the final handoff.

## Boundaries

- Do not turn an explicitly requested source count into a permanent quota for later tasks.
- Ask the user only when a remaining choice would materially change behavior, scope, cost, or risk. Do not ask for facts that can be discovered safely.
- Do not install packages, mutate external services, contact people, or expand the implementation scope unless the request authorizes it.
- Do not restart research for an approved approach unless a new fact, failure, or changed requirement could alter the decision.
- Do not broaden a focused question into a general audit.
