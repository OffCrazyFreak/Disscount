Make sure to always follow dry and clean code principles, with separation of concerns, modularity, and reusability in mind.

Make sure to always follow project structure and conventions, including file organization, naming conventions, and coding styles, but feel free to suggest improvements when appropriate.

After every code generation, ALWAYS provide a brief explanation of the code changes you made and why because I'm still learning and I want to become a better developer.

Make sure to always fetch and follow proper and most recent documentation, especially for libraries.

Do not prematurely optimize code. Focus on clarity and correctness first. Especially for frontend now that react compiler optimizations are very good.

# Frontend Development Guidelines

## Technology Stack Versions

**Core Framework & Runtime:**

- Next.js: `16.2.2` (App Router, Turbopack)
- React: `19.2.4`
- React DOM: `19.2.4`
- Package manager: pnpm `11.5.2` (settings live in `pnpm-workspace.yaml`, not the package.json `pnpm` field)

**Auth & Data layer:**

- better-auth: `1.6.14` (identity provider; Drizzle adapter; JWT plugin)
- @daveyplate/better-auth-ui: `3.4.0`
- Drizzle ORM: `0.45.2` / drizzle-kit: `0.31.10`
- pg (node-postgres): `8.21.0`
- dotenv: `17.4.2`
- (Auth tables live in Postgres alongside the Spring backend; the Spring backend validates better-auth JWTs via JWKS.)

**Key Libraries:**

- React Query (@tanstack/react-query): `5.101.0` (+ devtools `5.101.0`, react-virtual `3.14.2`)
- React Hook Form: `7.77.0` (+ @hookform/resolvers `5.4.0`)
- Recharts: `2.15.4`
- Zod: `4.4.3`
- Axios: `1.17.0`
- Sonner (Toast): `2.0.7`
- Lucide React (Icons): `0.561.0`
- Tailwind CSS: `4.3.0` (with @tailwindcss/postcss)
- Radix UI: `radix-ui` `1.5.0` (+ individual `@radix-ui/react-*` primitives)
- Motion (Animations): `12.40.0`
- cmdk: `1.1.1`, @yudiel/react-qr-scanner: `2.6.0`

**Development Tools:**

- TypeScript: `5.9.3`
- ESLint: `9.39.4` (eslint-config-next `16.2.2`)
- Tailwind CSS with PostCSS

**Backend (for context):** Spring Boot `3.1.0` on Java `21`, Spring Security OAuth2 Resource Server (validates better-auth JWTs via JWKS), Spring Data JPA + PostgreSQL.

## Guidelines

NEVER run "pnpm run dev" or any other development server command, because I always already have my dev server running. Also never run build commands.
NEVER use ":any" as a type in typescript code. Check the types and define proper interfaces or types when necessary.

ALWAYS check if all typescript types are correct and there are no type errors by using "pnpm exec tsc --noEmit" before providing the final code.
ALWAYS use frontend design skill when generating frontend code.

If you are asked to generate code that involves API calls, check if the API endpoints exist in the file disscount-api-docs.json and cijene-api-docs.json or the backend codebase. If they do not exist, inform me that the endpoints do not exist and ask for further instructions.

If you need to import some hooks or components from react library, ALWAYS import them by "import { x } from 'react';" instead of React.x or other ways.

Write all function with syntax "function functionName() {}" instead of arrow functions like "const functionName = () => {}" unless it's a small inline function.
WHen writing function ALWAYS check there already exists similar function in the codebase and reuse it instead of writing a new one, especially in all utils/ folders.

Feature-specific code goes in feature folders (products/, shopping-lists/), shared/generic code stays in central locations (utils/, lib/, constants/).

Add empty rows for better readability between logical blocks of code, my prettier will take care of the rest.

If I tell you to refactor something into a separate component or function, make sure to check if there already exists a similar component or function in the codebase and reuse it instead of writing a new one. If there is no similar component or function, then create a new one in a separate file, instead of writing it in the same file.

Never edit the package.json or packege-lock.json files directly, but instead use "pnpm add package-name@version" or "pnpm remove package-name" to manage dependencies.

If you need docs about a library, always fetch the most recent documentation from the official website or repository, instead of searching in node modules or other places.

# Backend Development Guidelines

NEVER run "mvn spring-boot:run" or any other development server command, because I always already have my dev server running. Also never run build commands.

# Commit message requirement

At the end of every response that includes code changes, include a suggested Git commit message.

Use this format:

```text
Short summary in imperative mood

Brief explanation of why the change was needed.

Changes:
- Specific change 1
- Specific change 2
- Specific change 3

Notes:
- Optional important detail for reviewers or future maintenance
```
