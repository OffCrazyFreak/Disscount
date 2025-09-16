# Disscount

## Description

Web and mobile (PWA) application for comparing product prices in Croatian stores, creating shopping lists, storing digital loyalty cards, and getting deal alerts with barcode scanning and AI suggestions.

## Link (temp)
Deployed and available on: _[disscount.netlify.app](https://disscount.netlify.app/)_

## Visuals

<p align="center">
  <img width="90%" src="https://github.com/user-attachments/assets/5567a6ee-1c9c-40cb-86eb-58b94e010ed5" alt="Disscount - Home page"/>
  
  <img width="45%" src="https://github.com/user-attachments/assets/5f87935e-f803-4c8e-813a-82c1513d911d" alt="Disscount - Search products"/>
  
  <img width="45%" src="https://github.com/user-attachments/assets/c9e460f0-f880-44ea-ade7-95627118434f" alt="Disscount - Product details 1"/>
  
  <img width="45%" src="https://github.com/user-attachments/assets/dc08334f-e48b-48a8-adbe-5df8b3091991" alt="Disscount - Product details 2"/>

  <img width="45%" src="https://github.com/user-attachments/assets/cdd9688a-2c3b-45e1-9ddf-073cd8eff603" alt="Disscount - Prefrences"/>
  
  <img width="45%" src="https://github.com/user-attachments/assets/68e51d74-b348-4295-8506-277ed0719eba" alt="Disscount - Shopping lists"/>
  
  <img width="45%" src="https://github.com/user-attachments/assets/3d200d85-cfea-4f25-9341-a96ee60da4a7" alt="Disscount - Shopping list details"/>
  
  <img width="45%" src="https://github.com/user-attachments/assets/fc6e93d7-ed97-43ec-b157-b5f111564972" alt="Disscount - Digital cards"/>
  
  <!--<img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Digital card details"/>-->
  
  <img width="45%" src="https://github.com/user-attachments/assets/20698d06-50ed-4d1c-ad6f-8cdd9c0d4cc8" alt="Disscount - Statistics"/>
  
</p>

## Attribution

**Created by: Jakov Jakovac**

Big thanks to _[Cijene API](https://github.com/senko/cijene-api/)_ for providing access to their API for data about products and store chains :)

## License [![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-cyan.svg

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

## How to run

### Prerequisites

- Node.js 22.19.0+ (or latest LTS)
- pnpm (or npm/yarn)
- Java 21
- Maven 3.9+
- PostgreSQL (local or remote)

### Startup flow

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

Thank you for helping improve Disscount - every contribution helps!
