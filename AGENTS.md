# AGENTS.md

Croatian grocery price comparison app. Next.js frontend, Spring Boot backend, self-hosted on Hetzner via Dokploy.
`CLAUDE.md` imports this file, so Claude Code and Codex read the same instructions.

The repository is public but the licence is BUSL-1.1, so it is source-available, not open source. Never describe it as open source anywhere, including marketing copy and docs.

## Boundaries

Never:

- Run a dev server. Mine is already running. That includes `pnpm dev`, `pnpm email`, and any Maven or Docker equivalent. No exceptions, including during migrations.
- Run any Maven command. Not `spring-boot:run`, not build, not test, not package. Ask if you think you need one.
- Run deploy, Docker, or Dokploy commands. Deploys happen automatically on push.
- Commit or push unless I explicitly ask. When asked, include only the requested task's changes.
- Commit secrets, credentials, the server IP, or the SSH user. Use placeholders in docs.
- Reference the gitignored private notes under `docs/` from any tracked file, or quote their contents. The ignore rules in `.gitignore` name them; a reference from anywhere else does not belong in a public repository.
- Hand-edit dependency entries or lockfiles, use npm, or generate a `package-lock.json`.
- Touch unrelated changes already sitting in the worktree. Do not revert, reformat, stage, or describe them as yours.
- Drive a browser for visual verification unless I ask for it in that same message.

Ask first:

- Adding or renaming an environment variable.
- Adding a dependency the task does not strictly require.
- Anything that needs a backend endpoint that does not exist yet.
- Widening scope beyond what I asked for.
- Any instruction of mine that has two plausible readings. Ask before you edit, do not pick one and start.

Hand back interactive installers and `init` wizards, except `pnpm dlx shadcn@latest add <component>`, which you may run.

Safe without asking, run from `frontend/`:

- `pnpm exec prettier --write --ignore-path ../.prettierignore "../<changed-path>"`
- `pnpm exec next typegen`, then `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm build`
- `pnpm add <name>@<version>` and `pnpm remove <name>`, once I have approved the dependency

Inside a git worktree, call the binaries directly (`./node_modules/.bin/tsc`) instead of `pnpm exec`, which purges the main tree's `node_modules` through the symlink.

## Definition of done

Prettier and `tsc --noEmit` must pass; run `pnpm build` only for migrations, dependency version changes, or newly added dependencies.

Type errors are yours to fix in `src/`. Do not chase errors coming out of generated types or dependencies, and never re-run a check I interrupted.

Say which checks passed, which failed, and which you did not run. For backend work, say what you verified by reading and which command I should run.

If a check fails for a reason unrelated to your change, report the command and the error, say it looks pre-existing, and leave it alone.

## How I want you to work

- Explain what you changed and why at the end. I am still learning, so the explanation is the point, not a formality.
- Never use em dashes or en dashes, anywhere: chat, code comments, UI copy, docs, commit messages, PR text. Use a comma, a colon, parentheses, or rewrite the sentence.
- In Markdown, write one physical line per paragraph and per bullet. Never hard-wrap prose to a column width.
- If a task has a standard-but-optional dimension, either do it or name it with a one-line recommendation and rough effort. Do not quietly drop it.
- Do not rewrite `docs/*.md` as you go, while the behaviour can still change. Track what went stale, then land the docs for the work in flight as one `docs:` commit when I ask you to push, open a PR, or close one, so the docs match what actually shipped. This is the one exception to the boundary above about a commit carrying only the requested task's changes. Remind me if I forget to ask.
- Prefer the smallest change that does the job. Merge code because it means the same thing, never because it looks the same.
- Keep files focused and short. I aim for roughly 50 to 100 lines and would rather have one more file than one long one. Split by concern, not to hit a number.
- Before writing a shared helper, hook, or component, look for an existing one in `utils/`, `hooks/`, and the relevant feature folder. If I ask you to extract something and nothing similar exists, give it its own new file rather than inlining it.
- Feature-specific code lives in the feature folder. Shared code lives in `utils/`, `lib/`, `constants/`, `typings/`.
- Use kebab-case filenames.
- Write code that explains itself. Comment only non-obvious decisions: business rules, security assumptions, compatibility quirks, why the simpler approach is unsafe. Never restate the code in a comment, and never expand into a broad refactor just to delete one.
- Leave a blank line between logical blocks. Prettier handles the rest.
- Do not optimise before it is a problem. The React Compiler is on and handles most of what you would hand-tune.
- For library APIs, read the current official docs for the version in `package.json` or `pom.xml`. Never grep `node_modules`. Skip the lookup for stable behaviour the codebase already demonstrates.

## Frontend (Next.js, `frontend/`)

`package.json` and the lockfile are authoritative for what is installed. What follows is intent and gotchas, not an inventory.

- `kysely` is a direct dependency only to pin better-auth's required peer. Nothing imports it.
- `dotenv` is read only by `drizzle.config.ts`, to load `.env.local` outside Next.
- `baseline-browser-mapping` is a direct dependency only so `frontend/pnpm-workspace.yaml` can exempt it from pnpm's release-age gate.
- `@eslint/eslintrc` and the `disscount` self-link are create-next-app leftovers. Nothing reads them.
- Import `server-only` in any module that must never reach the client.
- `next`, `react`, `react-dom`, `better-auth`, `drizzle-orm`, `kysely` and `pg` stay exact-pinned, so auth and data-layer bumps have to go through a reviewed PR. Everything else takes a range. Do not add a pin to a dependency with no security or data blast radius.
- After changing a dependency or a pnpm override, delete `node_modules`, `pnpm-lock.yaml` and `.next` before reinstalling. A plain `pnpm install` leaves the old resolution in place.
- Resetting the database means dropping both the `public` and the `drizzle` schemas. Dropping only `public` leaves the migration journal behind and `drizzle-kit migrate` silently no-ops.

Conventions:

- No `any`. Define the real type, or take `unknown` and narrow it.
- `I`-prefixed Props interfaces, in the same file as the component. One component per file, default export.
- `function name() {}`, not `const name = () => {}`, except for small inline callbacks.
- `import { useState } from "react"`, never `React.useState`.
- `components/ui/` is shadcn output, so do not hand-edit it. Our components live in `components/custom/`, grouped by concern.
- Types: API and domain go in `lib/api/schemas/*` as zod `*Dto` / `*Response`; external price API types in `lib/cijene-api/schemas.ts`; shared UI types in `@/typings`; feature-only types stay colocated in `*-types.ts`.
- React Query hooks live next to their service in `lib/api/<domain>/`. Feature composition hooks go in the feature's `hooks/`.
- Before generating or redesigning UI, read `frontend/.github/skills/frontend-design/SKILL.md` and follow it.

Accessibility is where I have had to go back and fix things most often, so check these before you hand UI work over:

- Every icon-only control has an accessible name, and it does not contradict a visible label sitting next to it.
- Decorative icons are hidden from the accessibility tree.
- Anything clickable is keyboard operable, and a control nested inside a card does not trigger the card's own navigation.
- Dialogs move focus in on open and restore it on close.
- Counts and status that change without a navigation are announced.
- Motion respects `prefers-reduced-motion`.

Croatian copy uses second person ("ti"), never third person ("vi"), and ungendered forms. The company voice ("mi") stays as it is. This covers accessible names, `alt` text and `title` attributes, not just visible text. There is no i18n framework and every string is a hardcoded literal, so write the Croatian inline and do not reach for a translation library.

Before wiring an API call, confirm the endpoint exists in `backend/` or in https://github.com/senko/cijene-api, which is upstream and not ours to change. Do not invent endpoints, fields, or auth behaviour. If the contract is missing, finish everything else in scope and tell me exactly what is missing.

## Backend (Spring, `backend/`)

- The app is a resource server. `oauth2-resource-server` validates better-auth's ES256 JWTs via JWKS.
- Tests run on H2, so anything Postgres-specific has to be portable or profile-guarded.
- Versions come from the `spring-boot-starter-parent` BOM, so most dependencies carry no `<version>`. Only the ones outside the BOM pin their own, and `lombok.version` is pinned because the compiler's annotation processor path needs it explicitly.
- Swagger UI is at `/api-docs`, and springdoc's major has to track the Spring Boot major.
- `ddl-auto=update` never drops anything, so changing an enum column to String leaves a stale CHECK constraint that 500s on write.
- Every zone-less timestamp column is stamped through `Timestamps.nowUtc()`, never `LocalDateTime.now()`, and JPA auditing is pointed at the same clock by `JpaConfig`. The columns carry no offset, so the JVM zone would otherwise leak into the wire format. The frontend's `parseServerDate` reads them back as UTC, and the two halves have to agree.

## Branches and releases

Work lands on `dev`. A production release is a `dev` into `main` pull request. Before one of those, dev-vs-main goes through a multi-tool review and the findings land as their own `fix:` PR, with the artifacts kept in `reviews/`.

Getting one change onto another branch means cherry-picking that commit, not merging the branch, because `dev` usually carries unrelated work. Do not open or merge a pull request unless I asked for one.

Adding something to the project board means asking me which column first. Never leave Status empty.

## Deployment

Self-hosted on Hetzner via Dokploy (Docker Compose). Full reference in `docs/DEPLOYMENT.md`.

Environment variables live in Dokploy, set per environment, never in committed files. `NEXT_PUBLIC_*` is baked at build time, so changing one needs a redeploy, not a restart.

When a change needs a new environment variable, tell me what it controls and whether it is required, server-only, or public, then add it with a placeholder to the example file it belongs to:

- root: `.env.example`
- frontend: `frontend/.env.local.example`
- backend: `backend/.env.example`

Keep the example file structurally in sync with its real counterpart. Never put a real value in a tracked file.

## Commit message

End every response that changed code with a suggested message. Check `git status --short` and the relevant diff first, and cover only this task's changes.

```text
type(scope): Short summary in imperative mood

Changes:
- Specific change

Brief explanation of why the change was needed.
```

Add a `Notes:` section only when there is something a reviewer would otherwise miss.

Types in use: `fix`, `feat`, `docs`, `refactor`, `chore`, `style`, `perf`, `ci`. Scope is the kebab-case area, matching a folder where one exists: `products`, `pwa`, `watchlist`, `shopping-lists`, `settings`, `auth`, `search`, `scanner`, `landing`, `header`, `sidebar`, `bottom-nav`, `price-history`, `modals`, `ui`, `brand`, `a11y`, `deps`, `agents`.

Never add a `Co-Authored-By` trailer.

Name the issues a commit or PR closes, and use full 40-character SHAs when referring to commits. `Closes #N` only fires on a merge into `main`, so a PR targeting `dev` links but never closes, and I close those by hand. Anything filed on `senko/cijene-api` links back to https://disscount.me and this repository.
