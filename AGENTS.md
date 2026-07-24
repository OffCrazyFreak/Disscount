# General

These principles apply across the whole repo (frontend and backend).

- Write code all like a senior dev - always follow DRY and clean code principles, with separation of concerns, modularity, and reusability in mind. The files should aim to be 50-100ish lines long, so they are easy to read, parse, and maintain.

- Add empty rows for better readability between logical blocks of code, my prettier will take care of the rest.

- Before writing any function or component, ALWAYS check the codebase (especially utils/ and hooks/ folders) for a similar one and reuse it. If I ask you to refactor something out and nothing similar exists, create it in a new separate file instead of inline.

- Always follow project structure and conventions, including file organization, naming conventions, and coding styles, but feel free to suggest improvements when appropriate.
- Always use kebab-case naming of files if you can.
- Feature-specific code goes in feature folders (products/, shopping-lists/), shared/generic code stays in central locations (utils/, lib/, constants/).

- Write self-explanatory code. Use comments only for genuinely complex logic or decisions. NEVER USE multi-line comments to explain something UNLESS STRICLY NECCESSARY, if you think you should you _probably_ did it wrong and YOU SHOULD TRY TO REWRITE IT AND ALL CONNECTED CODE (basically a full refractor, while keeping funcionality) so you don't need it. So don't simply remove comments, but refractor everything conected so it doesn't need a comment anymore.

- Do not prematurely optimize code. Focus on clarity and correctness first. Especially for frontend now that react compiler optimizations are very good.

- After every code generation, ALWAYS provide a brief explanation of the code changes you made and why because I'm still learning and I want to become a better developer.

- Always fetch and follow proper and most recent documentation, especially for libraries. Fetch it from the official website or repository, instead of searching in node modules or other places.

- If you need to add env variables, first notify the user and then update both the .env file and the example.env file. Always make sure they are in sync.

## Commit message requirement

At the end of every response that includes code changes, include a suggested Git commit message. To make sure you don't miss any changes, first check with git status and git diff what are the changes made, and then using this info and your conversation history in this chat, make a message.

Use this format:

```text
type(scope): Short summary in imperative mood

Changes:
- Specific change 1
- Specific change 2
- Specific change 3

Brief explanation of why the change was needed.

Notes:
- Optional important detail for reviewers or future maintenance
```

# Next.js (frontend)

## Tech stack

Versions live in `frontend/package.json` (the source of truth) - read them there instead of duplicating them. Non-obvious choices:

- Several core deps (`next`, `react`, `better-auth`, `drizzle-orm`, `kysely`, `pg`, `recharts`) are pinned exactly (no `^`) on purpose - keep them that way.
- `kysely` is held at `0.28.17` because better-auth's kysely-adapter breaks on `0.29`.

Installed libs - reach for these instead of reinventing them (names only, versions in `package.json`):

- Core: next, react, react-dom
- Auth: better-auth, @daveyplate/better-auth-ui
- DB: drizzle-orm, drizzle-kit, pg, kysely
- Data & state: @tanstack/react-query (+ devtools, persist-client, query-async-storage-persister), @tanstack/react-virtual
- Forms & validation: react-hook-form, @hookform/resolvers, zod
- HTTP: axios
- UI: radix-ui (+ individual @radix-ui/react-\*), lucide-react, sonner, cmdk, vaul, class-variance-authority, clsx, tailwind-merge, tailwindcss, tw-animate-css
- Charts: recharts
- Animation: motion
- PWA & offline: @serwist/next, serwist, idb-keyval
- Scanning: @yudiel/react-qr-scanner, barcode-detector
- Email: resend, react-email
- Images: sharp
- Monitoring: @sentry/nextjs
- Tooling: eslint, eslint-config-next, prettier, typescript, react-scan, @openapitools/openapi-generator-cli

## Guidelines

NEVER run "pnpm run dev" or any other development server command, because I always already have my dev server running. Also never run build commands.

NEVER use ":any" as a type in typescript code. Check the types and define proper interfaces or types when necessary.

Use I-prefix for interfaces, and use default exports wherever possible.

If you need to import some hooks or components from react library, ALWAYS import them by "import { x } from 'react';" instead of React.x or other ways.

Write all functions with syntax "function functionName() {}" instead of arrow functions like "const functionName = () => {}" unless it's a small inline function.

ALWAYS check if all typescript types are correct and there are no type errors by first formatting "pnpm exec prettier" and then using "pnpm exec tsc --noEmit" before providing the final code.
After editing ANY repo files, run `pnpm exec prettier --write --ignore-path ../.prettierignore "../<file-or-glob>"` from `frontend/` before committing, since CI format-checks those too.

ALWAYS use frontend design skill when generating UI code.

Never edit the package.json or package-lock.json files directly, but instead use "pnpm add package-name@version" or "pnpm remove package-name" to manage dependencies.

If you are asked to generate code that involves API calls, check if the API endpoints exist in the repo https://github.com/senko/cijene-api/ or the backend codebase. If they do not exist, inform me that the endpoints do not exist and ask for further instructions.

In Croatian wording, always use drugo lice ("ti"), nikad treće lice ("vi").
Also always use ungendered forms.
Leave the company voice ("mi") intact.

## Project structure (frontend/src)

- `app/` - Next.js routes. A feature folder uses `components/` + `hooks/` + `utils/` + `typings/` (add only what it needs).
- `components/ui/` - shadcn primitives, do not hand-edit. `components/custom/` - our components, grouped into concern folders (`header/`, `sidebar/`, `search/`, `store-chain/`, `price/`, `common/`, ...). `settings/` is the reference sub-feature layout: `components/ hooks/ tabs/ ui/` plus nested `security/` and `onboarding/`.
- `lib/` - data & infra: `api/` (internal service layer + `schemas/` zod models), `cijene-api/` (external price API), `modal/`, `offline/`, `email/`, `auth*`.
- Root: `hooks/` (shared hooks), `context/`, `utils/` (shared helpers), `constants/`, `typings/` (shared types), `emails/`, `db/`.

Where things go:

- Types: API/domain -> `lib/api/schemas/*` (zod `*Dto`/`*Response`); external price API -> `lib/cijene-api/schemas.ts`; shared UI/util -> `@/typings`; feature-only -> colocated `*-types.ts`.
- React Query hooks: colocate with their service under `lib/api/<domain>/`; feature-specific composition hooks go in the feature `hooks/`.
- One component per file (default export); its `I`-prefixed Props interface stays in the same file.

# Spring (backend)

NEVER run "mvn spring-boot:run" or any other development server command, because I always already have my dev server running. Also never run build commands.

## Tech stack

Versions are managed by the Spring Boot parent (`3.1.0`) in `backend/pom.xml` - read them there. Non-obvious notes:

- Java 21; the app is a resource server - `oauth2-resource-server` validates better-auth's ES256 JWTs via JWKS.
- Tests run against H2.

Installed libs - reach for these instead of reinventing them (versions in `pom.xml`):

- Spring Boot starters: data-jpa, web, validation, security, oauth2-resource-server, mail, actuator
- DB driver: postgresql
- API docs: springdoc-openapi (Swagger UI at `/api-docs`) - its major tracks the Spring Boot major, so 2.x for Boot 3.x and 3.x for Boot 4.x
- Monitoring: sentry-spring-boot-starter-jakarta
- Boilerplate: lombok
- Config: springboot3-dotenv (me.paulschwarz), the Boot 3 module of spring-dotenv since its 5.0.1 artifact split
- Testing: spring-boot-starter-test, spring-security-test, h2

# Deployment

The app is self-hosted on a Hetzner VPS via Dokploy (Docker Compose). See docs/DEPLOYMENT.md for the full infrastructure reference (architecture, env vars, DNS/SSL, backups, monitoring).

NEVER run deployment, Docker, or Dokploy commands (deploy, build, push images, prune, server restarts) unless I explicitly ask, since deploys happen automatically on push.

Environment variables live in Dokploy, set per environment, NOT in committed files. Remember `NEXT_PUBLIC_*` vars are baked at build time, so changing them needs a redeploy, not just a restart.

The repository is PUBLIC. NEVER commit secrets, credentials, the server IP, or the SSH user; use placeholders in any committed docs.
