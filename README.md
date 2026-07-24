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

Deeper references live in [docs/](docs/): [authentication](docs/AUTH.md), [PWA & offline](docs/PWA.md), [state persistence](docs/STATE-PERSISTENCE.md), and [deployment](docs/DEPLOYMENT.md).

## Link

Deployed and available on: _[disscount.me](https://disscount.me/)_

## Visuals

<!--
TODO: Record a short demo video / GIF (under 20s) and embed it at the very top of this Visuals section, above the landing screenshots.
Keep it fast: no typing, no form-filling, just quick cuts through pre-seeded screens that show off the core value.
Use the seeded jjakovac account so the lists, watchlist and cards are already full, and land on URLs directly so nothing has to be typed on camera.

Recommended flow (quick cuts, ~1-1.5s each, ends around 18-19s):
  1. (0-3s)   Landing hero: brand + tagline, one small scroll to hint at the sections below.
  2. (3-7s)   Search results, land straight on /products?q=nutella (no typing): the same product priced across chains, cursor gliding to the cheapest.
  3. (7-12s)  Open that product: the price-per-chain list plus the price-history chart drawing in. This is the hero shot, the "is the discount real?" moment.
  4. (12-16s) A shopping list detail: items with per-store basket totals, briefly highlighting the cheapest store's total.
  5. (16-19s) Quick flash: the watchlist with a price-drop target, then the installed PWA on a phone. End on the logo / disscount.me.

Capture the desktop cuts at 1440x900, the phone flash on the mobile PWA. Export as an optimized looping GIF, or a muted autoplay MP4/<video> for smaller size and better quality.
-->

Landing page ([full-page screenshot](docs/screenshots/desktop/pages/landing.webp)):

<p align="center">
  <img width="62%" src="docs/screenshots/desktop/pages/landing-hero.webp" alt="Disscount - Landing page"/>
  <img width="20%" src="docs/screenshots/mobile/pages/landing.webp" alt="Disscount - Landing page on mobile"/>
</p>

### Features

<p align="center">
  <img width="45%" src="docs/screenshots/desktop/pages/search.webp" alt="Disscount - Product search across 29 chains"/>
  <img width="45%" src="docs/screenshots/desktop/pages/product-detail.webp" alt="Disscount - Product details with price history"/>
</p>

<p align="center">
  <img width="45%" src="docs/screenshots/desktop/pages/shopping-lists.webp" alt="Disscount - Shopping lists"/>
  <img width="45%" src="docs/screenshots/desktop/pages/shopping-list-detail.webp" alt="Disscount - Shopping list with per-store basket totals"/>
</p>

<p align="center">
  <img width="45%" src="docs/screenshots/desktop/pages/watchlist.webp" alt="Disscount - Product watchlist with price-drop targets"/>
  <img width="45%" src="docs/screenshots/desktop/pages/digital-cards.webp" alt="Disscount - Digital loyalty cards"/>
</p>

<p align="center">
  <img width="45%" src="docs/screenshots/desktop/settings/preference.webp" alt="Disscount - Preferences (nearby stores and locations)"/>
  <img width="45%" src="docs/screenshots/desktop/pages/statistics.webp" alt="Disscount - Market statistics per chain"/>
</p>

### On your phone

<p align="center">
  <img width="19%" src="docs/screenshots/mobile/pages/search.webp" alt="Disscount - Product search on mobile"/>
  <img width="19%" src="docs/screenshots/mobile/pages/product-detail.webp" alt="Disscount - Price history on mobile"/>
  <img width="19%" src="docs/screenshots/mobile/pages/shopping-list-detail.webp" alt="Disscount - Shopping list on mobile"/>
  <img width="19%" src="docs/screenshots/mobile/pages/watchlist.webp" alt="Disscount - Watchlist on mobile"/>
  <img width="19%" src="docs/screenshots/mobile/pages/digital-cards.webp" alt="Disscount - Digital cards on mobile"/>
</p>

## Attribution

**Created by: Jakov Jakovac**

Big thanks to _[Cijene API](https://github.com/senko/cijene-api/)_ for providing access to their API for data about products and store chains :)

## Support

If Disscount saves you money or you would like to support its development, you can buy me a coffee. Every bit helps keep the project going and hosted.

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/disscount)

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

- Node.js 24 LTS+ and pnpm
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

Disscount is self-hosted on a Hetzner VPS using [Dokploy](https://dokploy.com) (Docker Compose), with Traefik for routing and automatic Let's Encrypt TLS, and Cloudflare in front for DNS, CDN, and proxying. Production deploys automatically from the `main` branch, and a staging environment deploys from the `dev` branch, on every push.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full infrastructure reference: architecture, environment variables, DNS and SSL, security, backups and restore, monitoring, and how to add more apps to the server.

## How to contribute

Contributions are welcome, whether it's a bug report, feature idea, documentation improvement or code change. See the **[Contributing guide](.github/CONTRIBUTING.md)** for how to report issues, set up your environment, and open a pull request.

Please also review our **[Code of Conduct](.github/CODE_OF_CONDUCT.md)**. To report a security vulnerability, follow the **[Security Policy](.github/SECURITY.md)** rather than opening a public issue.

Thank you for helping improve Disscount - every contribution helps!
