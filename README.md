# Disscount (WIP)

## Description

Web and mobile (PWA) application for comparing product prices in Croatian stores, creating shopping lists, storing digital loyalty cards, and getting deal alerts with barcode scanning and AI suggestions.

Since May 15th 2025, Croatian retail chains are legally required to publicly publish their product prices. Disscount turns that raw public data (via the open [Cijene API](https://github.com/senko/cijene-api/)) into clear comparisons, price history and shopping decisions.

## Features

**Live:**

- Product search across 29 Croatian retail chains (with barcode scanning)
- Price comparison per store and price history charts ("is the discount real?")
- Smart shopping lists with per-store basket totals
- Product watchlist
- Installable PWA that works offline (IndexedDB reads, background-sync writes)
- Google + email/password auth with account linking

**Coming soon (marked with an USKORO badge in the app):**

- Price-drop notifications
- Digital loyalty cards
- Store map with working hours
- Spending analysis and market statistics
- Shopping list sharing

## Link

Deployed and available on: _[disscount.me](https://disscount.me/)_

## Visuals

Landing page ([full-page screenshot](docs/screenshots/landing-full.png)):

<p align="center">
  <img width="90%" src="docs/screenshots/landing-hero.png" alt="Disscount - Landing page hero"/>

  <img width="45%" src="docs/screenshots/landing-mobile.png" alt="Disscount - Landing page on mobile"/>
  
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

## License [![BUSL 1.1][busl-shield]][busl]

[busl]: https://spdx.org/licenses/BUSL-1.1.html
[busl-shield]: https://img.shields.io/badge/License-BUSL%201.1-cyan.svg

This work is licensed under the
[Business Source License 1.1 (BUSL-1.1)](https://github.com/OffCrazyFreak/Disscount/blob/main/LICENSE).

License parameters used in this repository:

- Licensor: Jakov Jakovac
- Additional Use Grant: None
- Change Date: Five (5) years from the date the Licensed Work is published
- Change License: GPL-3.0-or-later

Under BUSL-1.1 terms, each version converts on the Change Date or on the fourth anniversary of first publicly available distribution of that version, whichever comes first.

Commercial use is restricted unless covered by an Additional Use Grant or separate commercial terms from the Licensor.

## How to run

The quickest way to run the full stack (frontend + backend + PostgreSQL) locally is with Docker Compose:

```bash
cp example.env .env   # then fill in the values
docker compose up -d --build
# frontend: http://localhost:3000
```

To run the services manually instead, follow the steps below.

### Prerequisites

- Node.js 22 LTS+ and pnpm
- Java 21 and Maven 3.9+
- PostgreSQL 14+ (17 in production)
- Docker + Docker Compose (only for the quick-run path above)

### Startup flow

The backend and frontend share one PostgreSQL database: the backend owns the app tables (Hibernate `ddl-auto`), the frontend owns the better-auth tables (drizzle). Create the database, run the backend, then the frontend.

### 1. Database (PostgreSQL)

Create a database and user (example), and reuse these values in both env files below:

```bash
sudo -u postgres psql -c "CREATE USER disscount WITH PASSWORD 'secret';"
sudo -u postgres psql -c "CREATE DATABASE disscount OWNER disscount;"
```

### 2. Backend (Spring Boot)

```bash
cd backend
cp .env.example .env
```

Set in `backend/.env`:

- `SPRING_DATASOURCE_URL` (e.g. `jdbc:postgresql://localhost:5432/disscount`)
- `SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD`
- `BETTER_AUTH_JWKS_URI` (e.g. `http://localhost:3000/api/auth/jwks`)

Build and run with the `local` Spring profile (it supplies local better-auth defaults, the JWKS URL and issuer at `http://localhost:3000`, so the app starts without extra config):

```bash
mvn clean install
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

The backend runs on port 8080. Swagger UI: http://localhost:8080/api-docs

### 3. Frontend (Next.js)

```bash
cd frontend
cp .env.local.example .env.local
```

Set in `frontend/.env.local` (see the file for the full list):

- `DATABASE_URL` (same Postgres DB, e.g. `postgresql://disscount:secret@localhost:5432/disscount`)
- `BETTER_AUTH_SECRET` (strong random string) and `BETTER_AUTH_URL=http://localhost:3000`
- `NEXT_PUBLIC_API_URL=http://localhost:8080` and `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- Google OAuth (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) and Facebook (`FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`)
- `RESEND_API_KEY` + `EMAIL_FROM`, and `CIJENE_API_URL` + `CIJENE_API_TOKEN`

Install dependencies, create the better-auth tables, then run:

```bash
pnpm install
pnpm drizzle-kit migrate   # creates the better-auth tables in the shared DB
pnpm dev
```

The frontend runs on http://localhost:3000

### MCP servers (optional, for AI editors)

The repo ships pre-configured MCP servers so an AI editor picks them up on clone, one file per tool (same servers): `.mcp.json` (Claude Code), `.cursor/mcp.json` (Cursor), `.vscode/mcp.json` (VS Code).

| Server            | Purpose                            |
| ----------------- | ---------------------------------- |
| `playwright`      | Browser automation / E2E           |
| `context7`        | Up-to-date library docs            |
| `supabase`        | Supabase project access            |
| `chrome-devtools` | Chrome DevTools debugging          |
| `sentry`          | Error tracking (Disscount)         |

No secrets are committed: `supabase` and `sentry` authenticate via browser OAuth on first use, and `context7` runs keyless (set `CONTEXT7_API_KEY` in your environment to raise rate limits). Never put keys in these files - use env vars or your editor's secret store.

`playwright` needs a browser at runtime: run `npx playwright install chromium` once per machine, or point it at an existing browser via `PLAYWRIGHT_MCP_EXECUTABLE_PATH` (e.g. `/opt/helium/chrome`). Both are machine-local, so keep the browser path out of the committed config.

## Deployment

Disscount is self-hosted on a Hetzner VPS using [Dokploy](https://dokploy.com) (Docker Compose), with Traefik for routing and automatic Let's Encrypt TLS, and Cloudflare in front for DNS, CDN, and proxying. Production deploys automatically from the `master` branch, and a staging environment deploys from the `dev` branch, on every push.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full infrastructure reference: architecture, environment variables, DNS and SSL, security, backups and restore, monitoring, and how to add more apps to the server.

## How to contribute

Contributions are welcome - whether it's a bug report, feature idea, documentation improvement or code change. Below are guidelines to make the process smooth for everyone.

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
