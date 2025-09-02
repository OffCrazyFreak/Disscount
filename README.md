# Disscount

## Description

Web and mobile (PWA) application for comparing product prices in Croatian shops, creating shopping lists, storing digital loyalty cards, and getting deal alerts with barcode scanning and AI suggestions.

### Link: _TODO_

## Visuals

<p align="center">
  <img width="90%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Home page"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Search products"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Product details"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Shopping lists"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Shopping list details"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Digital cards"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Digital card details"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Statistics"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Prefrences"/>
</p>

## Attribution

**Created by:**

- Jakov Jakovac

## License [![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-cyan.svg

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

## How to run

### Prerequisites

- Java 21
- Maven 3.9+
- Node.js 18+ (or latest LTS)
- pnpm (or npm/yarn)
- PostgreSQL (local or remote)
- Git

### Game flow

- Start the backend first (so API is available), then start the frontend.

### Running the backend

1. Database (PostgreSQL)

- Create database and user (example):
  sudo -u postgres psql -c "CREATE USER disccount WITH PASSWORD 'secret';"
  sudo -u postgres psql -c "CREATE DATABASE disccount OWNER disccount;"
- Adjust names/passwords as needed.

2. Backend setup

- Copy/configure environment variables (backend expects):
  - SPRING_DATASOURCE_URL (e.g. jdbc:postgresql://localhost:5432/disscount)
  - SPRING_DATASOURCE_USERNAME
  - SPRING_DATASOURCE_PASSWORD
  - JWT_SECRET (strong random string)
- You can copy `.env.example` to `.env` in the backend folder if present.
- Build and run:
  cd backend
  mvn clean install
  mvn spring-boot:run
- The backend starts on port 8080 by default. Open API docs at:
  http://localhost:8080/api-docs

### Running the frontend

3. Frontend setup

- Install and run:
  cd frontend
  pnpm install
  pnpm dev
- The frontend runs on port 3000 by default: http://localhost:3000

## How to contribute

Contributions are welcome — whether it's a bug report, feature idea, documentation improvement or code change. Below are guidelines to make the process smooth for everyone.

### Reporting bugs & suggesting ideas

- Search existing issues before opening a new one to avoid duplicates.
- Create a new issue and include:
  - A clear title and description of the problem or idea.
  - Steps to reproduce (for bugs) and expected vs actual behavior.
  - Environment details (OS, Java/Maven/Node versions, Postgres version, browser) if relevant.
  - Attach screenshots, logs or example requests/responses when helpful.
- Use labels if available (bug, enhancement, question, docs).

### Contributing code (pull requests)

1. Fork the repository and create a feature branch from `master`:
   - Branch name example: `feat/add-search-by-barcode` or `fix/shopping-list-null-pointer`.
2. Follow project coding style:
   - Backend: Java 21, use existing package structure and formatting.
   - Frontend: follow existing TypeScript/React patterns, use Prettier extension and linting rules.
3. Run tests and build locally before creating a PR:
   - Backend: `cd backend && mvn clean install` (use `-DskipTests` only for quick local debugging).
   - Frontend: `cd frontend && pnpm install && pnpm dev` (and run any available tests/lint scripts).
4. Commit messages should be concise and descriptive. Reference related issue numbers in the PR or commit message.
5. Open a pull request against the `master` branch and include:
   - A summary of changes, why they were made, and any migration steps.
   - Screenshots or short recordings for UI changes.
   - Links to related issues.

### Pull request checklist

- [ ] Code builds and tests pass locally.
- [ ] Linting/formatting applied.
- [ ] No sensitive data (passwords, secrets) included.

### Non-code contributions

- Other improvements such as translations, UI & UX suggestions, icons and designs are welcome. Open issues or PRs just like for code.
- Propose larger ideas in an issue first so maintainers can provide feedback before an implementation.

### Review process

- Maintainers will review PRs, request changes if necessary, and merge when ready.
- Code Rabbit (an automated code-review tool) runs on pull requests and posts suggestions. Please review and address its recommendations before requesting a final review; if you disagree with a suggestion, explain why in the PR comments. Maintainers may require resolving important warnings before merging.
- Please be responsive to review comments - small follow-ups are common.

### Communication & conduct

- Be respectful and constructive. This project follows the license in the repository; if a Code of Conduct is added later, contributors must follow it.

Thank you for helping improve Disscount — every contribution helps!
