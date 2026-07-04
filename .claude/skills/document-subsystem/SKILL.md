---
name: document-subsystem
description: Write a detailed reference doc (docs/<NAME>.md) for one part of the Disscount app (auth, PWA, i18n, shopping-lists, price-history, etc.), in the style of docs/DEPLOYMENT.md. Explore the code first, then document what it is, how it works, automatic vs manual, key files, config/env, libraries, gotchas, and future TODOs. Use when the user asks to document, write docs for, or create a reference for a feature or subsystem.
---

# Document a subsystem

Write a detailed, beginner-friendly reference doc for the part of the app named in the arguments (for example `auth`, `pwa`, `i18n`, `shopping-lists`, `price-history`). If no subsystem was given, ask which one before starting.

## Steps

1. **Explore first, do not guess.** Find and read the actual code for this subsystem before writing anything: the relevant routes, components, hooks, context, config, env vars, message files, and libraries. Follow imports until you understand the flow end to end. If something is ambiguous, check the code or ask.

2. **Write `docs/<NAME>.md`** (uppercase kebab of the subsystem, e.g. `AUTH.md`, `PWA.md`, `I18N.md`) covering:
   - What it is and how it works, end to end (add a Mermaid flow diagram if it helps).
   - What is automatic vs what needs manual work (a table).
   - The key files and where they live (a table with paths and roles).
   - Config, env vars, and feature flags involved.
   - Libraries used, with versions read from `frontend/package.json` or `backend/pom.xml`.
   - Gotchas and lessons that would bite someone (the traps, with the fix).
   - A final "Future improvements & TODOs" section.

Assume the reader is still learning, so explain the concepts clearly. Use tables and Mermaid diagrams wherever they make it easier to follow.

## Conventions

- The repo is PUBLIC: never include secrets, tokens, real IPs, or private URLs; use placeholders.
- No em dashes.
- Do not hard-wrap Markdown; write one physical line per paragraph and per bullet, and let the editor wrap.
- Match the structure and tone of `docs/DEPLOYMENT.md`.

Do one subsystem per run so the exploration stays focused. The finished file is added to a PR into `dev`, then `master`.
