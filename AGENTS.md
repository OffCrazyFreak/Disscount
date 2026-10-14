# AGENTS.md

Croatian grocery price comparison app: Next.js frontend, Spring Boot backend, self-hosted on Hetzner via Dokploy. `CLAUDE.md` imports this file, so Claude Code and Codex read the same instructions.

The repository is public under BUSL-1.1, so it is source-available. Never call it open source, including in marketing copy and docs.

## Boundaries

Never:

- Run deploy or Dokploy commands; a push deploys automatically.
- Commit or push unless I ask, and then only the requested task's changes.
- Commit secrets, credentials, the server IP or the SSH user; docs use placeholders.
- Reference or quote the gitignored private notes under `docs/` from a tracked file. Only `.gitignore` may name them, because the repository is public.
- Hand-edit dependency entries or lockfiles, use npm, or generate a `package-lock.json`.
- Commit with `--no-verify` or push to `main`. The hooks in `frontend/.husky/` format staged files and reject trailers and dashes in commit messages; fix what they flag.
- Touch unrelated changes already in the worktree: do not revert, reformat, stage, or claim them.
- Drive a browser for visual verification unless I ask in that same message.

Ask first:

- Adding or renaming an environment variable.
- Adding a dependency the task does not strictly require.
- Anything needing a backend endpoint that does not exist yet.
- Widening scope beyond what I asked.
- A reading of my instruction that leads to materially different work. Routine judgment calls are yours.

**Ask means ask.** Put each item above to me as a question. Never route around it by working around a missing endpoint, hand-rolling the dependency, or narrowing the task: I say yes far more often than no, so the quiet workaround costs me the better answer. Everything else is your call: decide, finish the whole task, and say in your summary what you decided and why.

Hand back interactive installers and `init` wizards, except `pnpm dlx shadcn@latest add <component>`, which you may run.

Safe without asking, run from `frontend/`:

- `pnpm exec prettier --write --ignore-path ../.prettierignore "../<changed-path>"`
- `pnpm exec next typegen`, then `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test`, the Vitest suite: `*.test.ts` runs in Node, `*.test.tsx` runs components and hooks in jsdom through the React Compiler, and MSW fails any request a test did not declare. Conventions are in `docs/TESTING.md`
- `pnpm test:coverage`, the same suite with a V8 coverage report in `frontend/coverage/`
- `pnpm exec fallow audit --base origin/dev`, the CI gate for dead code, duplication, complexity, import cycles and the `src/app` versus shared-folder boundary (`.fallowrc.json`). It judges only findings a change adds beyond `.fallow-baselines/`, and CI fails any verdict but `pass`, including the `warn` that new duplication gets; `pnpm exec fallow` prints the whole backlog. Refresh a baseline only when a review agreed the larger backlog is acceptable.
- `pnpm build`
- `pnpm add <name>@<version>` and `pnpm remove <name>`, once I have approved the dependency

Inside a git worktree, call binaries directly (`./node_modules/.bin/tsc`), not `pnpm exec`, which purges the main tree's `node_modules` through the symlink; the `.claude/hooks/guard-commands.py` PreToolUse hook blocks `pnpm` there, and `--no-verify` and pushes to `main` everywhere. After editing the hook, `guard_git.py` or `guard-commands.test.py`, run the test.

Safe without asking, run from `backend/`:

- `mvn -B verify`: the CI gate (compile, package, tests).
- `mvn -B -DskipTests package`: a build-only check while iterating.
- `mvn -B test`: the suite alone.

Tests run on H2 and touch nothing outside the module, so none needs a nod.

## Definition of done

- Frontend: Prettier, `tsc --noEmit` and `pnpm test` pass, and `fallow audit` reports `pass`. Run `pnpm build` only for migrations, dependency version changes or new dependencies.
- Backend: `mvn -B verify` passes; it is the gate, not an extra. Its tests cover digital cards, store names, account deletion and the entity validation handler; elsewhere a green run proves only that the code compiles, so say so.
- Fix type errors in `frontend/src/` and compile and test failures in `backend/src/`. Ignore errors from generated types or dependencies, and never re-run a check I interrupted.
- Say which checks passed, failed, or did not run, on both sides. Never report backend work as verified by reading when you could have run `mvn -B verify`.
- A failure unrelated to your change: report the command and the error, say it looks pre-existing, and leave it alone.

## How I want you to work

- Nontrivial change, or I say research: run the `research` skill first, then settle open product choices with me. Research-only requests end with the report.
- End by explaining what changed and why. I am learning, so the explanation is the point.
- No em or en dashes anywhere: chat, comments, UI copy, docs, commits, PR text. Use a comma, a colon, parentheses, or rewrite.
- Run the `unslop` skill on everything written to me (updates, reports, handoffs) and on product copy.
- Markdown: one physical line per paragraph and per bullet; never hard-wrap.
- A task's standard-but-optional dimension: do it, or name it with a one-line recommendation and rough effort. Never drop it quietly.
- Leave `docs/*.md` alone while behaviour can still change. Track what went stale and land it as one `docs:` commit when pushing, opening or closing a PR, unasked, so the docs match what shipped; it is the one exception to a commit carrying only the task's changes. In the summary, list the docs touched and those checked and left alone, or say nothing went stale.
- Prefer the smallest change that does the job. Merge code that means the same thing, never code that only looks the same.
- Keep files focused, roughly 50 to 100 lines, split by concern rather than to hit a number. One more file beats one long one.
- Before writing a shared helper, hook or component, check `utils/`, `hooks/` and the feature folder. An extraction I ask for with no existing match gets its own new file.
- Feature code lives in the feature folder; shared code in `utils/`, `lib/`, `constants/`, `typings/`.
- Kebab-case filenames.
- Comment only non-obvious decisions: business rules, security assumptions, compatibility quirks, why the simpler approach is unsafe. Never restate the code, and never refactor broadly just to delete a comment.
- Blank line between logical blocks; Prettier does the rest.
- Do not optimise before it is a problem; the React Compiler handles most hand-tuning.
- For library APIs, read the official docs for the version in `package.json` or `pom.xml`; never grep `node_modules`. Skip the lookup when the codebase already shows the behaviour.

## Frontend (Next.js, `frontend/`)

`package.json` and the lockfile are authoritative for what is installed. What follows is intent and gotchas, not an inventory.

- `kysely` is a direct dependency only to pin better-auth's required peer. Nothing imports it.
- `dotenv` is read only by `drizzle.config.ts`, to load `.env.local` outside Next.
- `baseline-browser-mapping` is a direct dependency only so `frontend/pnpm-workspace.yaml` can exempt it from pnpm's release-age gate.
- `@vitejs/plugin-react` and `@rolldown/plugin-babel` exist only so Vitest compiles `.tsx` tests through the React Compiler. Next.js builds with its own compiler integration and never loads them. `@vitest/coverage-v8` stays on the exact `vitest` version, because its peer dependency is exact.
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
- `components/ui/` is shadcn output; edit it only where the primitive is the natural home (a prop it should own, a sizing rule our `--spacing` override breaks). Our components live in `components/custom/`, grouped by concern.
- Types: API and domain go in `lib/api/schemas/*` as zod `*Dto` / `*Response`; external price API types in `lib/cijene-api/schemas.ts`; shared UI types in `@/typings`; feature-only types stay colocated in `*-types.ts`.
- React Query hooks live next to their service in `lib/api/<domain>/`. Feature composition hooks go in the feature's `hooks/`.
- The React Compiler caches reads off the stable `form` object, so a component or hook that did not call `useForm` reads values with `useWatch` and state with `useFormState`, never `form.watch()` or `form.formState` in render. Destructure every flag you need; react-hook-form computes only the ones read.
- Never rely on an effect re-running every render: the compiler memoizes what used to be rebuilt, so an effect retrying a possible no-op (`resetField` on a field a portal has not registered, measuring DOM not there yet) runs once. The escape hatch is `"use no memo"` with a comment saying why.
- Before generating or redesigning UI, read `frontend/.github/skills/frontend-design/SKILL.md` and follow it.

Check these before handing over UI work; accessibility is what I most often fix afterwards:

- Every icon-only control has an accessible name, and it does not contradict a visible label sitting next to it.
- Decorative icons are hidden from the accessibility tree.
- Anything clickable is keyboard operable, and a control nested inside a card does not trigger the card's own navigation.
- Dialogs move focus in on open and restore it on close.
- Counts and status that change without a navigation are announced.
- Motion respects `prefers-reduced-motion`.

Copy in every language uses informal singular address and ungendered forms: Croatian "ti" (never "vi"), "you", "tu", "ti", "du". The company voice ("mi") stays. This covers accessible names, `alt` and `title` too. The app ships in Croatian, English, Italian, Slovenian and German through next-intl; `docs/I18N.md` explains the setup.

- Never inline copy. Add the key to `frontend/src/i18n/messages/hr/` and the same file in every other locale, then run `pnpm i18n:check` (CI runs it too).
- Use ICU plurals and number formats instead of building strings by hand. Croatian needs `one`, `few` and `other`, Slovenian adds `two`.
- Data constants hold message keys (`labelKey`), not text.
- Import `Link`, `redirect`, `useRouter` and `usePathname` from `@/i18n/navigation`, never from `next/link` or `next/navigation`.
- Pass the locale to the formatting helpers in `utils/`; they have no Croatian default on purpose.
- A new backend error or validation message needs a key in all five `messages*.properties` files.

Before wiring an API call, confirm the endpoint exists in `backend/` or upstream in https://github.com/senko/cijene-api, which is not ours to change. Never invent endpoints, fields or auth behaviour; if the contract is missing, finish the rest of the scope and tell me exactly what is missing.

## Backend (Spring, `backend/`)

- The app is a resource server. `oauth2-resource-server` validates better-auth's ES256 JWTs via JWKS.
- Tests run on H2, so anything Postgres-specific has to be portable or profile-guarded.
- Versions come from the `spring-boot-starter-parent` BOM, so most dependencies carry no `<version>`. Only the ones outside the BOM pin their own, and `lombok.version` is pinned because the compiler's annotation processor path needs it explicitly.
- Swagger UI is at `/api-docs`, and springdoc's major has to track the Spring Boot major.
- `ddl-auto=update` never drops anything, so changing an enum column to String leaves a stale CHECK constraint that 500s on write.
- Stamp every zone-less timestamp column through `Timestamps.nowUtc()`, never `LocalDateTime.now()`; `JpaConfig` points JPA auditing at the same clock. The columns carry no offset, so the JVM zone would leak into the wire format, and the frontend's `parseServerDate` reads them back as UTC.

## Branches and releases

- Work lands on `dev`; a release is a `dev` into `main` PR. Before one, dev-vs-main goes through a multi-tool review whose findings land as their own `fix:` PR, artifacts in `reviews/`.
- Move one change to another branch by cherry-picking it, not merging, because `dev` usually carries unrelated work.
- Open or merge a PR only when I ask.
- Before adding to the project board, ask me which column. Never leave Status empty.

## Deployment

Dokploy on Hetzner (Docker Compose); full reference in `docs/DEPLOYMENT.md`.

Environment variables live in Dokploy per environment, never in committed files. `NEXT_PUBLIC_*` is baked at build time, so changing one needs a redeploy, not a restart.

A new environment variable: tell me what it controls and whether it is required, server-only or public, then add it with a placeholder to its example file:

- root: `.env.example`
- frontend: `frontend/.env.local.example`
- backend: `backend/.env.example`

Keep each example file structurally in sync with its real counterpart, with no real values.

## Commit message

End every response that changed code with a suggested message, written from `git status --short` and the diff, covering only this task's changes.

```text
type(scope): Short summary in imperative mood

Changes:
- Specific change

Brief explanation of why the change was needed.
```

Add a `Notes:` section only when there is something a reviewer would otherwise miss.

Types: `fix`, `feat`, `docs`, `refactor`, `chore`, `style`, `perf`, `ci`. Scope is the kebab-case area, matching a folder where one exists: `products`, `pwa`, `watchlist`, `shopping-lists`, `settings`, `auth`, `search`, `scanner`, `landing`, `header`, `sidebar`, `bottom-nav`, `price-history`, `modals`, `ui`, `brand`, `a11y`, `i18n`, `deps`, `agents`.

Never add a `Co-Authored-By` trailer.

Name the issues a commit or PR closes, and cite commits by full 40-character SHA. `Closes #N` fires only on a merge into `main`, so a PR into `dev` links but never closes; I close those by hand. Anything filed on `senko/cijene-api` links back to https://disscount.me and this repository.
