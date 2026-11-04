# AGENTS.md

Croatian grocery price comparison app: Next.js frontend, Spring Boot backend, self-hosted on Hetzner via Dokploy.

Call the repository source-available, never open source, because BUSL-1.1 is not an open source license.

## Ask first

Put these to me instead of working around them: I say yes far more often than no.

- Ask before adding or renaming an environment variable.
- Ask before adding a dependency the task does not strictly require.
- Ask where a new product, price, store or search feature belongs, because my own price service is undecided.
- Ask before changing how the app looks (size, spacing, colour, layout), accessibility fixes and side effects included, with before and after screenshots.
- Ask before adding anything that can bill; services, plans and CI stay free or hard-capped, even with 100k users.
- Hand back interactive installers and `init` wizards, except `pnpm dlx shadcn@latest add <component>`, which you may run.
- Change legal copy as you judge right without asking, and log what changed, why and the sources on #217.

## Never commit

- Never commit secrets, the server IP or the SSH user; use placeholders in docs.
- Leave unrelated changes already in the worktree alone: no revert, reformat, stage or claim.
- Use pnpm only; never hand-edit a dependency entry or lockfile, or add a `package-lock.json`.

## Done means

- Run `pnpm check` in `frontend/` until it passes.
- Run `mvn -B verify` in `backend/` until it passes; it needs Docker.
- When you touch code `docs/TESTING.md` lists as mostly untested, say so.
- Fix type errors in `frontend/src/` and compile and test failures in `backend/src/`; ignore errors from generated types and dependencies.
- When a failure is unrelated to your change, report the command and the error, say it looks pre-existing, and leave it.
- Report a check I interrupted as not run, without re-running it.
- After editing `.claude/hooks/`, run `python3 .claude/hooks/guard-commands.test.py`.
- Put docs in the same PR as their own `docs:` commit before the PR opens, and again if behaviour changes.
- Document a new or reshaped subsystem with the `document-subsystem` skill.
- List docs touched and those checked and left alone in your summary.
- When the T3 Code preview browser is available, use it for previews and screenshots and for pages that block or error on fetch.

## Worktrees and git

- Create worktrees under `/home/jj/.t3/worktrees/Disscount/<name>`; the `worktree-checks` skill has installs, checks, the dev server and dependency changes.
- Branches are `<type>/<kebab-description>`; rename T3's `t3/<hex>` branch before the first push.
- On `Permission denied (publickey)`, repeat the push over HTTPS: `git -c credential.helper= -c "credential.helper=!gh auth git-credential" push https://github.com/OffCrazyFreak/Disscount.git HEAD:refs/heads/<branch>`.
- Fetch and merge the latest `origin/dev` before resuming an open PR.
- Use one worktree and branch per PR into `dev`, and commit, push and open the PR yourself.
- Move a change to another branch by cherry-picking, because `dev` usually carries unrelated work.

## PRs and review

- Fill in `.github/PULL_REQUEST_TEMPLATE.md`.
- Give every PR one Sonnet `reviewer`; CodeRabbit runs on its own, and only a release waits for it.
- For 5000+ changed lines, 50+ files, or auth, security, personal data or migrations, also run Greptile once: `@greptileai review` or its CLI.
- For a release into `main`, run one `reviewer` per app area plus CodeRabbit and Greptile (automatic or CLI), and wait for all of them.
- Land release review findings as their own `fix:` PR, and keep the notes in `~/Documents/Disscount`.
- Before any merge, settle every PR comment and `pulls/N/reviews` body, bots included, with the smallest fix, the same mistake elsewhere in the PR included, or a reply giving the reason.
- Merge once CI is green and review is settled, as the orchestrating session; a delegate reports instead of merging.

## Board and issues

- Use project board 8, owner OffCrazyFreak, and always set Status.
- File each new issue atop Backlog through its own `researcher`, with fixed-SHA permalinks, sources, a fix plan and how to verify.
- Give a plan a tracking issue with the why, decisions, an ordered PR checklist and open questions.
- Set a tracking issue to In progress once its first PR runs, otherwise Sprint; tick each step its PR completes.
- Put owner-only steps (logins, payments, phone) as a draft at the top of In progress, with links and numbered steps.
- Move merged user-facing work to For review.
- Move merged invisible work to Done.

## Releases and production

- Land work on `dev`, and release through a `dev` into `main` PR.
- Append anything a release needs (data step, migration, env step, post-deploy check) to the release PR body now, saying what is left and by whom.
- Leave existing release notes as written; only append.
- Use Dokploy, Cloudflare, Sentry, `gh` and `ssh disscount` on dev and production without asking, verifying each step against official docs.
- Report every production change.
- Reach databases (`disscount-{development,production}-*-db-1`) with `docker exec <container> psql` over `ssh disscount`; `docs/INFRASTRUCTURE.md` has the rest.
- Set environment variables in Dokploy per environment; they apply at that service's next deploy, and `NEXT_PUBLIC_*` needs a rebuild.
- For a new variable, say what it controls and whether it is required, server-only or public, and add a placeholder to its example file.
- Keep `.env.example`, `frontend/.env.local.example` and `backend/.env.example` in sync with their real counterparts, with no real values.
- When nothing reads a variable, delete it from Dokploy, GitHub, the server and local `.env` files, keeping what `main` reads; print names only.
- Deploy everything through Dokploy, with no preview deployments, and ask before reviving Netlify.

## Frontend

Dependency intent the code does not show:

- `dotenv` is only for `drizzle.config.ts`; `esbuild` only for bundling `scripts/migrate.mjs` in the Dockerfile.
- `baseline-browser-mapping` is only so `pnpm-workspace.yaml` can exempt it from the release-age gate.
- `@vitejs/plugin-react` and `@rolldown/plugin-babel` are only so Vitest compiles through the React Compiler.
- Keep `@vitest/coverage-v8` on the exact `vitest` version, because its peer dependency is exact.
- Keep `next`, `react`, `react-dom`, `better-auth`, `drizzle-orm` and `pg` exact-pinned so auth and data bumps get reviewed; everything else takes a range.
- For every dependency change, a single bump included, delete `node_modules`, `pnpm-lock.yaml` and `.next`, then install, because a plain install keeps the old resolution.
- List the unrelated lockfile updates in the PR.
- Leave updates to Renovate, which reads `renovate.json` from `main` only; majors wait on the Dependency Dashboard issue.
- Expect Dependabot PRs until the next release.
- Read library docs through Context7, the official docs for the installed version, or `frontend/node_modules/next/dist/docs/` for Next.
- When resetting the database, drop both `public` and `drizzle`, because `drizzle-kit migrate` silently does nothing with the journal left behind.

Conventions:

- Write an `I`-prefixed Props interface in the component's file, one component per file, default export, `function name() {}`, kebab-case filenames.
- Import React names directly: `import { useState } from "react"`.
- Edit `components/ui/` (shadcn output) only where the primitive is the natural home; ours live in `components/custom/`.
- Put API and domain types as zod `*Dto` / `*Response` in `lib/api/schemas/*`, and price API types in `lib/cijene-api/schemas.ts`.
- Put query hooks beside their service in `lib/api/<domain>/`.
- Read the `frontend-design` skill before generating or redesigning UI.

Copy and i18n (`docs/I18N.md`):

- Write hr, en, it, sl and de with informal singular and ungendered forms, including `alt`, `title` and accessible names.
- Use Croatian "ti", never "vi"; the company voice "mi" stays.
- Add a key to `src/i18n/messages/hr/` and the same file in every other locale; `pnpm i18n:check` enforces it.
- Use ICU plurals and number formats; Croatian needs `one`, `few`, `other` and Slovenian adds `two`.
- Hold `labelKey` in data constants, not text.
- Import `Link`, `redirect`, `useRouter` and `usePathname` from `@/i18n/navigation`.
- Add a new backend error or validation message to all five `messages*.properties`.

## Backend

- The app is a resource server validating better-auth's ES256 JWTs via JWKS.
- Keep anything Postgres-specific portable or profile-guarded, because tests run on H2 with `src/test` properties and only `DoubleBootSchemaTest` boots main's on Postgres.
- When changing an enum column to String, expect a stale CHECK constraint: `ddl-auto=update` keeps it, writes 500, boot tests miss it.
- Keep springdoc's major on the Spring Boot major.
- When a DTO or enum the frontend reads changes, run `mvn -B test -Dtest=ApiContractTest -Dcontract.update=true` to refresh `contracts/backend-api.json`.
- Then update the zod schema until `backend-contract.test.ts` passes (`docs/API-CONTRACT.md`).
- Mark a nullable DTO field `@Schema(nullable = true)`, because springdoc ignores JSpecify `@Nullable`.
- Stamp zone-less timestamp columns through `Timestamps.nowUtc()`, never `LocalDateTime.now()`, because the JVM zone would leak into what `parseServerDate` reads as UTC.

## Writing

- Write issue, commit and PR titles and bodies in plain words a newcomer can follow.
- Explain in plain words, and define any jargon in one phrase.
- Write Markdown with one physical line per paragraph and bullet.
- Write numeric dates as `03.11.2026.` in Croatian text and ISO `2026-11-03` in English, with straight quotes (`docs/I18N.md`).

## Commits

Write the message from the staged diff in this template, without repeating it in chat. `frontend/.husky/commit-msg` rejects an unknown type, a subject over 72 characters, trailers and dashes.

```text
type(scope): Imperative summary

Why paragraph.

Changes:
- Specific change

Notes: A tradeoff.
```

- Use type `fix`, `feat`, `docs`, `refactor`, `chore`, `style`, `perf`, `ci` or `test`.
- Leave the scope out or reuse one from `git log`.
- Write the why paragraph in every commit: the problem and the reason, never repeating the subject.
- Add `Changes:` only for two or more separable parts.
- Add `Notes:` only for a tradeoff.
- Cite commits by full 40-character SHA.
- Write "Part of #N" in a PR into `dev`, because `Closes #N` fires only on a merge into `main`; I close it by hand.
- Link anything filed on `senko/cijene-api` back to https://disscount.me and this repository.
