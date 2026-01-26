Make sure to always follow dry and clean code principles, with separation of concerns, modularity, and reusability in mind.

Make sure to always follow project structure and conventions, including file organization, naming conventions, and coding styles, but feel free to suggest improvements when appropriate.

After every code generation, ALWAYS provide a brief explanation of the code changes you made and why because I'm still learning and I want to become a better developer.

Make sure to always fetch and follow proper and most recent documentation, especially for libraries.

Do not prematurely optimize code. Focus on clarity and correctness first. Especially for frontend now that react compiler optimizations are very good.

# Frontend Development Guidelines

## Technology Stack Versions

**Core Framework & Runtime:**

- Next.js: `16.0.10`
- React: `19.2.3`
- React DOM: `19.2.3`

**Key Libraries:**

- React Query (@tanstack/react-query): `^5.90.12`
- React Hook Form: `^7.68.0`
- Recharts: `2.15.4`
- Zod: `^4.1.13`
- Axios: `^1.13.2`
- Sonner (Toast): `^2.0.7`
- Lucide React (Icons): `^0.561.0`
- Tailwind CSS: `^4`
- Radix UI: Latest component versions
- Motion (Animations): `^12.23.26`

**Development Tools:**

- ESLint: Latest
- TypeScript: Latest
- Tailwind CSS with PostCSS: Latest

## Guidelines

NEVER run "pnpm run dev" or any other development server command, because I always already have my dev server running. Also never run build commands.
NEVER use ":any" as a type in typescript code. Check the types and define proper interfaces or types when necessary.

ALWAYS check if all typescript types are correct and there are no type errors by using "pnpm exec tsc --noEmit" before providing the final code.
ALWAYS use frontend design skill when generating frontend code.

If you are asked to generate code that involves API calls, check if the API endpoints exist in the file disscount-api-docs.json and cijene-api-docs.json or the backend codebase. If they do not exist, inform me that the endpoints do not exist and ask for further instructions.

If you need to import some hooks or components from react library, ALWAYS import them by "import { x } from 'react';" instead of React.x or other ways.

Write all function with syntax "function functionName() {}" instead of arrow functions like "const functionName = () => {}" unless it's a small inline function.

Feature-specific code goes in feature folders (products/, shopping-lists/), shared/generic code stays in central locations (utils/, lib/, constants/).

Add empty rows for better readability between logical blocks of code, my prettier will take care of the rest.

# Backend Development Guidelines

NEVER run "mvn spring-boot:run" or any other development server command, because I always already have my dev server running. Also never run build commands.
