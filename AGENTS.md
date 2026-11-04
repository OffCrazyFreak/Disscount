# AGENTS.md

Croatian grocery price comparison app: Next.js frontend, Spring Boot backend, self-hosted on Hetzner via Dokploy. The repository is public under BUSL-1.1, which makes it source-available, so marketing copy and docs never call it open source.

## Ask first

- A new or renamed environment variable.
- A dependency the task does not strictly require.
- Anything needing a backend endpoint that does not exist yet. Before wiring an API call, confirm the endpoint in `backend/` or upstream in https://github.com/senko/cijene-api, which is not ours to change, and name exactly what is missing.
- Where a new product, price, store or search feature belongs: the owner plans their own price service and has not decided its architecture.
- A change to how the app looks (size, spacing, colour, layout), with before and after screenshots. This includes accessibility fixes and side effects: #480 and #540 both changed the look unasked.
- Reversing an owner decision, such as an issue closed as won't fix. Search closed issues first. White text on the brand green is one of these and stays.

Put these to me rather than working around them: I say yes far more often than no, so the quiet workaround costs me the better answer.

Legal copy is the exception to asking about wording: change it as you judge right and log what changed, why and the sources on #217, because the legal pages get one full rewrite later.

## Never commit

- Secrets, the server IP or the SSH user; docs use placeholders.
- Unrelated changes already in the worktree.
- A hand-edited dependency entry or lockfile, or a `package-lock.json`: pnpm is the only package manager.

## Done means

- Frontend: `tsc --noEmit`, `eslint src --max-warnings 0`, Vitest and Prettier pass, and `fallow audit --base origin/dev` says `pass`. CI fails any other verdict, including the `warn` new duplication gets.
- Backend: `mvn -B verify` passes. It needs Docker for `DoubleBootSchemaTest`. Its tests cover digital cards, store names, account deletion, security chains, JWT decoding, JSON dates, problem responses, per-feature ownership, admin gating and the fields the frontend reads. Pricing, merging and jobs are mostly untested, so say so when you touch them.
- A failure unrelated to your change: report the command and the error, say it looks pre-existing, and leave it. Never re-run a check I interrupted.
- After editing `.claude/hooks/`, run `python3 .claude/hooks/guard-commands.test.py`.
- Docs go in the same PR as their own `docs:` commit before the PR opens, and again if behaviour changes. A new or reshaped subsystem gets its reference doc through the `document-subsystem` skill. The summary lists docs touched and those checked and left alone.

## Worktrees and git

- Worktrees live under `/home/jj/.t3/worktrees/Disscount/<name>`. pnpm is blocked there because it can purge the main checkout's `node_modules` through the symlink. The `worktree-checks` skill has the setup, the checks, `next dev --webpack` and dependency changes.
- Branches are `<type>/<kebab-description>`, never a tool prefix such as `t3code/`, created with `git checkout --no-track -b <branch> origin/dev` and pushed with `git push -u origin HEAD:refs/heads/<branch>`. `push.default=upstream` would otherwise land a tracking branch on `dev`; the guard hook refuses that.
- On `Permission denied (publickey)`, GitHub has refused this machine's valid key before. Repeat that one command over HTTPS: `git -c credential.helper= -c "credential.helper=!gh auth git-credential" push https://github.com/OffCrazyFreak/Disscount.git HEAD:refs/heads/<branch>`.
- One worktree and branch per PR into `dev`. Commit, push and open the PR yourself. Move one change to another branch by cherry-picking, because `dev` usually carries unrelated work.

## PRs and review

- Fill in `.github/PULL_REQUEST_TEMPLATE.md`. Decisions carry my choices and my reasons in my words, never the agent's rationale.
- Every PR gets one Sonnet high review, and a second only after large fixes.
- CodeRabbit and Greptile are for big or sensitive PRs: about 500+ changed lines or 15+ files, or anything touching auth, security, personal data or migrations. Comment `@coderabbitai review` and `@greptileai review` once. Never wait on their quota, because the Sonnet review is enough.
- Before a merge, read every comment and review, bots included, and settle each: fix it or reply with the reason. Read the `pulls/N/reviews` bodies too, since CodeRabbit keeps nitpicks and out-of-diff findings there, not in inline comments.
- The orchestrating session merges a PR once CI is green and review is settled. Delegates do not merge.
- UI change: run the worktree's dev server, open every changed screen in the T3 preview, then ask whether to attach screenshots to the PR. Attach with `gh pr edit --attach '<file>#<alt>'`, never from a branch, because GitHub can collect the commits behind those links once it is deleted. `--attach` rewrites Markdown images, not `<img>` tags.

## Board and issues

Project board 8, owner OffCrazyFreak. Status is never empty.

- New issues: top of Backlog, each researched by its own Sonnet agent, with permalinks at a fixed SHA, sources, a fix plan and how to verify.
- Plans: a tracking issue with the why, decisions, an ordered PR checklist and open questions, In progress once its first PR runs, otherwise Sprint. A PR that completes a step ticks it.
- Owner-only steps (their logins, payments, phone): a draft at the top of In progress with links and numbered steps.
- Merged user-facing work: For review, with screenshots of the changed screens on the card, because I move it to Done after looking. Invisible work: Done on merge.

## Releases and production

- Work lands on `dev`; a release is a `dev` into `main` PR. Before one, dev-vs-main gets the Sonnet review plus both bots, and findings land as their own `fix:` PR.
- Anything a release needs (a data step already run, a migration, an env step, a check after deploy) goes in the open release PR body in the same turn, saying what happened and what is left and by whom. Append; never reword existing notes.
- Dokploy, Cloudflare, Sentry, `gh` and `ssh disscount` are yours to use on dev and production, without asking. Read the official docs for each step, verify it, and report every production change.
- Databases are containers named `disscount-{development,production}-*-db-1`, reached with `docker exec <container> psql` over `ssh disscount`. `docs/INFRASTRUCTURE.md` has the full reference.
- Environment variables live in Dokploy per environment. Saving one changes nothing until that service's next deploy, and `NEXT_PUBLIC_*` is baked at build time, so it needs a redeploy.
- A new variable: say what it controls and whether it is required, server-only or public, then add it with a placeholder to `.env.example`, `frontend/.env.local.example` or `backend/.env.example`.
- Dokploy deploys everything and there are no preview deployments. Netlify is disconnected; ask rather than revive it.

## Frontend

Dependency intent the code does not show:

- `dotenv` is only for `drizzle.config.ts`; `esbuild` only for bundling `scripts/migrate.mjs` in the Dockerfile; `baseline-browser-mapping` only so `pnpm-workspace.yaml` can exempt it from the release-age gate; `@vitejs/plugin-react` and `@rolldown/plugin-babel` only so Vitest compiles through the React Compiler.
- `@vitest/coverage-v8` stays on the exact `vitest` version, because its peer dependency is exact.
- `next`, `react`, `react-dom`, `better-auth`, `drizzle-orm` and `pg` stay exact-pinned so auth and data bumps go through a reviewed PR. Everything else takes a range.
- Every dependency change, a single bump included, regenerates the lockfile in full: delete `node_modules`, `pnpm-lock.yaml` and `.next`, then install. A plain install keeps the old resolution. List the unrelated updates in the PR.
- Updates come from Renovate, which reads `renovate.json` from `main` only, so a change takes effect at the next release. Majors wait on the Dependency Dashboard issue.
- The Next.js docs for the installed version ship in `frontend/node_modules/next/dist/docs/`, so read those for Next; other libraries use their official docs for the version in `package.json`.
- Resetting the database means dropping both `public` and `drizzle`. Dropping only `public` leaves the journal behind and `drizzle-kit migrate` silently does nothing.

Conventions:

- `I`-prefixed Props interface in the component's file, one component per file, default export, `function name() {}`, kebab-case filenames, `import { useState } from "react"`.
- `components/ui/` is shadcn output, edited only where the primitive is the natural home. Ours live in `components/custom/`.
- API and domain types are zod `*Dto` / `*Response` in `lib/api/schemas/*`; price API types in `lib/cijene-api/schemas.ts`; query hooks beside their service in `lib/api/<domain>/`.
- The React Compiler caches reads off the stable `form` object, so anything that did not call `useForm` uses `useWatch` and `useFormState`, never `form.watch()` or `form.formState` in render. Destructure every flag; react-hook-form computes only those read.
- An effect that retries a possible no-op runs once, because the compiler memoizes what used to be rebuilt. The escape hatch is `"use no memo"` with a comment saying why.
- Read the `frontend-design` skill before generating or redesigning UI.

UI accessibility is what I most often fix afterwards, so check before handing over, and take anything visual to Ask first: icon-only controls have a name that does not contradict a visible label; decorative icons are hidden; everything clickable works by keyboard and a control inside a card does not trigger the card; dialogs move focus in and restore it; counts and status that change without navigation are announced; motion respects `prefers-reduced-motion`.

Copy and i18n (`docs/I18N.md`):

- Hr, en, it, sl and de, with informal singular and ungendered forms in every language: Croatian "ti", never "vi". The company voice "mi" stays. This covers `alt`, `title` and accessible names.
- Add a key to `src/i18n/messages/hr/` and the same file in every other locale; `pnpm i18n:check` enforces it. Use ICU plurals and number formats. Croatian needs `one`, `few`, `other`; Slovenian adds `two`. Data constants hold `labelKey`, not text.
- Croatian or English naming and wording choices go to me, except legal copy (above).
- Import `Link`, `redirect`, `useRouter`, `usePathname` from `@/i18n/navigation`.
- A new backend error or validation message needs a key in all five `messages*.properties`.

## Backend

- The app is a resource server validating better-auth's ES256 JWTs via JWKS.
- Tests run on H2 with `application.properties` from `src/test`, so anything Postgres-specific has to be portable or profile-guarded. Only `DoubleBootSchemaTest` boots main's properties on real Postgres.
- `ddl-auto=update` never drops anything, so changing an enum column to String leaves a stale CHECK constraint that 500s on write, and no boot test sees it.
- springdoc's major has to track the Spring Boot major.
- A DTO or enum the frontend reads also changes `contracts/backend-api.json`: refresh it with `mvn -B test -Dtest=ApiContractTest -Dcontract.update=true`, then update the zod schema until `backend-contract.test.ts` passes (`docs/API-CONTRACT.md`). A nullable DTO field carries `@Schema(nullable = true)`, because springdoc ignores JSpecify `@Nullable`.
- Stamp zone-less timestamp columns through `Timestamps.nowUtc()`, never `LocalDateTime.now()`. The columns carry no offset, so the JVM zone would leak into the wire format, and the frontend's `parseServerDate` reads them as UTC.

## Skills

Skills live in `.agents/skills`, linked from `.claude/skills`. `research`, `unslop`, `big-change` and `debloat` are copies of `~/.config/agents/skills`: change them there, then copy. Vendored ones are tracked in `skills-lock.json` and replaced wholesale.

## Writing

- Markdown: one physical line per paragraph and bullet, never hard-wrapped. Prettier and `.prettierignore` cover the rest.
- Numeric Croatian dates read `03.11.2026.`, and quotes are straight, Croatian included (`docs/I18N.md`).

## Commits

One purpose per commit, written from the staged diff, in this template. The hooks in `frontend/.husky/` format staged files and reject trailers and dashes.

```text
type(scope): Short summary in imperative mood

Changes:
- Specific change

Brief explanation of why the change was needed.
```

Add a `Notes:` section only for something a reviewer would otherwise miss.

Types: `fix`, `feat`, `docs`, `refactor`, `chore`, `style`, `perf`, `ci`. Scope is the kebab-case area: `products`, `pwa`, `watchlist`, `shopping-lists`, `settings`, `auth`, `search`, `scanner`, `landing`, `header`, `sidebar`, `bottom-nav`, `price-history`, `modals`, `ui`, `brand`, `a11y`, `i18n`, `deps`, `agents`.

Cite commits by full 40-character SHA. `Closes #N` fires only on a merge into `main`, so a PR into `dev` says "Part of #N" and I close it by hand. Anything filed on `senko/cijene-api` links back to https://disscount.me and this repository.
