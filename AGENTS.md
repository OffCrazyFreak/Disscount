Make sure to always follow dry and clean code principles, with separation of concerns, modularity, and reusability in mind.

Make sure to always follow project structure and conventions, including file organization, naming conventions, and coding styles, but feel free to suggest improvements when appropriate.

After every code generation, ALWAYS provide a brief explanation of the code changes you made and why because I'm still learning and I want to become a better developer.

# Frontend Development Guidelines

NEVER run "pnpm run dev" or any other development server command, because I always already have my dev server running. Also never run build commands.
NEVER use ":any" as a type in typescript code. Check the types and define proper interfaces or types when necessary.

ALWAYS check if all typescript types are correct and there are no type errors first by linting using "pnpm run lint" and then by using "pnpm exec tsc --noEmit" before providing the final code.
ALWAYS use frontend design skill when generating frontend code.

If you are asked to generate code that involves API calls, check if the API endpoints exist in the file disscount-api-docs.json and cijene-api-docs.json or the backend codebase. If they do not exist, inform me that the endpoints do not exist and ask for further instructions.

# Backend Development Guidelines

NEVER run "mvn spring-boot:run" or any other development server command, because I always already have my dev server running. Also never run build commands.
