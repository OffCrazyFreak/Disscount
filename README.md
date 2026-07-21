# Disscount

**Find the cheapest groceries in Croatia.** Disscount compares product prices across every major retail chain, shows real price history so you can tell whether a discount is genuine, and turns shopping lists into per-store basket totals.

[![Live](https://img.shields.io/badge/live-disscount.me-06b6d4)](https://disscount.me) [![License: BUSL 1.1](https://img.shields.io/badge/License-BUSL%201.1-cyan.svg)](https://spdx.org/licenses/BUSL-1.1.html) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-149eca) ![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3-6DB33F) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1)

## Description

Since May 15th 2025, Croatian retail chains are legally required to publish their product prices publicly. Disscount turns that raw open data (via the [Cijene API](https://github.com/senko/cijene-api/)) into clear comparisons, real price history and better shopping decisions. It runs in any browser and installs as an offline-capable PWA, so your lists and recently viewed prices keep working even with no signal in the store.

Under the hood it is a full production stack: a Next.js frontend that also acts as the identity provider (better-auth), a Spring Boot API that owns user data, and a shared PostgreSQL database, self-hosted on a Hetzner VPS via Dokploy behind Cloudflare. The codebase is source-available under BUSL-1.1 and documented (see [docs/](docs/)), and contributions are welcome.

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

## Tech stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn-style UI, TanStack Query, React Hook Form + Zod, Motion
- **Backend:** Spring Boot 3 (Java 21), PostgreSQL 17, JPA / Hibernate
- **Auth:** better-auth (in Next.js) issues ES256 JWTs, validated by Spring as an OAuth2 resource server via JWKS
- **PWA & offline:** Serwist service worker, IndexedDB-backed React Query cache, offline reads and queued writes
- **Infra:** Docker Compose, Dokploy on a Hetzner VPS, Traefik, Cloudflare, Sentry, Umami

Deeper references live in [docs/](docs/): [authentication](docs/AUTH.md), [PWA & offline](docs/PWA.md), and [deployment](docs/DEPLOYMENT.md).

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
- Change Date: Four (4) years from the date the Licensed Work is published
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

| Server            | Purpose                    |
| ----------------- | -------------------------- |
| `playwright`      | Browser automation / E2E   |
| `context7`        | Up-to-date library docs    |
| `supabase`        | Supabase project access    |
| `chrome-devtools` | Chrome DevTools debugging  |
| `sentry`          | Error tracking (Disscount) |

No secrets are committed: `supabase` and `sentry` authenticate via browser OAuth on first use, and `context7` runs keyless (set `CONTEXT7_API_KEY` in your environment to raise rate limits). Never put keys in these files - use env vars or your editor's secret store.

`playwright` needs a browser at runtime: run `npx playwright install chromium` once per machine, or point it at an existing browser via `PLAYWRIGHT_MCP_EXECUTABLE_PATH` (e.g. `/opt/helium/chrome`). Both are machine-local, so keep the browser path out of the committed config.

## Deployment

Disscount is self-hosted on a Hetzner VPS using [Dokploy](https://dokploy.com) (Docker Compose), with Traefik for routing and automatic Let's Encrypt TLS, and Cloudflare in front for DNS, CDN, and proxying. Production deploys automatically from the `master` branch, and a staging environment deploys from the `dev` branch, on every push.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full infrastructure reference: architecture, environment variables, DNS and SSL, security, backups and restore, monitoring, and how to add more apps to the server.

## How to contribute

Contributions are welcome, whether it's a bug report, feature idea, documentation improvement or code change. See the **[Contributing guide](.github/CONTRIBUTING.md)** for how to report issues, set up your environment, and open a pull request.

Please also review our **[Code of Conduct](.github/CODE_OF_CONDUCT.md)**. To report a security vulnerability, follow the **[Security Policy](.github/SECURITY.md)** rather than opening a public issue.

Thank you for helping improve Disscount - every contribution helps!
