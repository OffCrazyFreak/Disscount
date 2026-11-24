---
name: research
description: Researches implementation and product decisions before coding, with official docs (Context7 first), apps that solve the same problem, and what practitioners say. Use whenever the user says research, investigate, look into, check the docs, what are people saying, is there a way, are you sure, compare, how do others do it, verify current behavior, or find best practices, and before any nontrivial change that depends on current external facts, even when the word research is absent. Skip trivial edits and approved decisions unless new uncertainty arises.
---

# Research

Evidence first, then a plain-terms explanation and a recommendation. The user's instructions win over this skill.

## Size, named in the first line

- Fact check ("does X support Y"): Context7, vendor docs, and a practitioner source when the answer drives a change.
- Decision ("how should we build X", "compare A and B", "how do others do it"): all three source kinds below.
- Audit (review of what exists, or the user says audit): all three kinds, peer apps included, across everything in scope.
- In doubt, take the heavier size. Hidden complexity upgrades it; nothing downgrades it.

There is no source count to hit. A decision needs different kinds of source, so it does not rest on blog summaries, and more than one independent voice in each kind that fits. Stop when new sources repeat what you have and the remaining doubt would not change the recommendation. A count the user asks for applies to that request only.

## Mode

- Research only: no edits, installs or implementation. A report file only when asked or when the result is large.
- Research then implement: report; if a product choice is open, ask and wait; if none, say so and build at the settled scope.
- Advice or review: the facts the answer needs, nothing more.

## Steps

Track them in the task list when the harness has one, otherwise restate them in the reply. Name any step you skip.

1. Ground. Instructions, the matching `docs/` page, the code and config the decision touches, and its git history (`git log -p`, blame, linked PRs and issues) for why it is the way it is. Record installed versions (`package.json`, lockfile, `--version`); every source is checked against those, never a main branch. Live state (DNS, provider settings, quotas, prices) comes from the MCP or API now, never from docs. Read the user's own links first and in full; name any you could not read.
2. Questions. List the facts that would change the decision. Separate them from product preferences only the user can settle.
3. Official. Context7: resolve the library, pull the topic. Missing there: say so, read the vendor docs. Then release notes and the source at the installed tag. Open every page; a snippet, a summary or memory is not a source. Search wide, then narrow; fetch independent pages in parallel.
4. Peers (decision and audit). Popular open source apps solving the same problem, of similar size and stack. Read the code path and the reasoning: README, ADRs, the PR or issue where the choice was made, maintainer posts and talks. Note who agrees, who differs, and the constraint that explains it. `sources.md` says where to look.
5. Practitioners. YouTube (subtitles via `yt-dlp` when installed; a page fetch has no transcript, say when a video went unread), engineering blogs, issues and discussions, Stack Overflow, Reddit, Hacker News, forums. Weigh by author, date, version and confirmation. Record the reasoning, not the verdict. Find who disagrees before recommending.
6. Cross-check. Every claim traces to a page read or a command run this session; anything else is labelled a hypothesis. Dates and versions against step 1. Where sources disagree, say which wins here and why. Name any evidence you could not reach, the blocked URL included, and what it leaves open.
7. Report. Plain terms first, then the recommendation and why it wins here. One line naming the kinds of source used and any kind missing; a link beside each claim. Peer apps one line each. Alternatives with a recommendation beside each. Open choices go to a question card as the global instructions describe. Manual steps numbered, each with its direct link from a page read this session. Length matches the size.

## Red flags

| Thought                          | Reality                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| "The repo docs already say it"   | Docs hold decisions and traps; live state comes from the MCP, API or vendor page now. |
| "The main branch shows it"       | The installed version is the truth; read the source at its tag.                       |
| "I remember this API"            | Memory is a hypothesis until a page read this session confirms it.                    |
| "The snippet is enough"          | Open the page; snippets drop the condition that changes the answer.                   |
| "One good blog post agrees"      | One source is an anecdote; find who disagrees first.                                  |
| "Three blogs agree"              | They may repeat each other; check the docs and the code too.                          |
| "Quick fact, skip the size line" | One sentence lets the user stop a wrong-sized effort.                                 |

## Boundaries

- Ask only when a remaining choice changes behaviour, scope, cost or risk; never for a fact you can discover.
- Do not restart research for an approved approach unless a new fact or failure could change it.
- Do not widen a focused question into an audit.
