<p align="center">
  <a href="https://disscount.me"><img src="frontend/public/brand/social/og-image.png" alt="Disscount - Pronađi najbolje cijene u Hrvatskoj" width="100%"/></a>
</p>

# Disscount

**Find the cheapest groceries in Croatia.** Disscount compares product prices across every major retail chain, shows real price history so you can tell whether a discount is genuine, and turns shopping lists into per-store basket totals.

[![Live](https://img.shields.io/badge/live-disscount.me-06b6d4)](https://disscount.me) [![Uptime](https://img.shields.io/badge/uptime-status%20page-2ec50d)](https://stats.uptimerobot.com/ej4ROz2eMo) [![License: BUSL 1.1](https://img.shields.io/badge/License-BUSL%201.1-cyan.svg)](https://spdx.org/licenses/BUSL-1.1.html) ![Next.js](https://img.shields.io/badge/Next.js-black) ![React](https://img.shields.io/badge/React-149eca) ![Spring Boot](https://img.shields.io/badge/Spring%20Boot-6DB33F) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1)

## Description

Since May 15th 2025, Croatian retail chains are legally required to publish their product prices publicly. Disscount turns that raw open data (via the [Cijene API](https://github.com/senko/cijene-api/)) into clear comparisons, real price history and better shopping decisions. It runs in any browser and installs as an offline-capable PWA, so your lists and recently viewed prices keep working even with no signal in the store.

Under the hood it is a full production stack: a Next.js frontend that also acts as the identity provider (better-auth), a Spring Boot API that owns user data, and a shared PostgreSQL database, self-hosted on a Hetzner VPS via Dokploy behind Cloudflare. The codebase is source-available under BUSL-1.1 and documented (see [docs/](docs/)), and contributions are welcome.

## Features

**Live:**

- Product search across 25+ Croatian retail chains (with barcode scanning)
- Price comparison per store and price history charts ("is the discount real?")
- Smart shopping lists with per-store basket totals
- Shared shopping lists via a private link, with view, shop or edit access and a revocable token
- Product watchlist
- Installable PWA that works offline (IndexedDB reads, background-sync writes)
- Google + email/password auth with account linking

**Coming soon (marked with an USKORO badge in the app):**

- Price-drop notifications
- Digital loyalty cards
- Store map with working hours
- Spending analysis and market statistics

## Tech stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, shadcn-style UI on Radix + lucide-react, TanStack Query (+ Virtual), React Hook Form + Zod, Axios, Motion, Recharts, Sonner, cmdk, Base UI drawers
- **Backend:** Spring Boot on Java, PostgreSQL, JPA / Hibernate, Spring Security + OAuth2 resource server, Bean Validation, Lombok, springdoc-openapi (Swagger UI), Actuator
- **Auth:** better-auth (in Next.js) issues ES256 JWTs, validated by Spring as an OAuth2 resource server via JWKS. Drizzle owns the auth tables
- **PWA & offline:** Serwist service worker, IndexedDB-backed React Query cache (idb-keyval), offline reads and queued writes, in-browser barcode scanning
- **Email:** Resend + React Email
- **Infra:** Docker Compose, Dokploy on a Hetzner VPS, Traefik, Cloudflare, Sentry, [UptimeRobot](https://stats.uptimerobot.com/ej4ROz2eMo), Umami

Deeper references live in [docs/](docs/): [authentication](docs/AUTH.md), [PWA & offline](docs/PWA.md), [mobile navigation](docs/MOBILE-NAV.md), [state persistence](docs/STATE-PERSISTENCE.md), [list sharing](docs/SHARING.md), [search](docs/SEARCH.md), [the landing page](docs/LANDING.md), [brand assets](docs/BRAND.md), [the support flow](docs/SUPPORT.md), [products](docs/PRODUCTS.md), [product images](docs/PRODUCT-IMAGES.md), [infrastructure and deployment](docs/INFRASTRUCTURE.md), and [backups](docs/BACKUPS.md).

## Link

Deployed and available on: _[disscount.me](https://disscount.me/)_

Live uptime and response times: _[status page](https://stats.uptimerobot.com/ej4ROz2eMo)_

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
  <img width="45%" src="docs/screenshots/desktop/pages/search.webp" alt="Disscount - Product search across 25+ chains"/>
  <img width="45%" src="docs/screenshots/desktop/pages/product-detail.webp" alt="Disscount - Product details with price history"/>
</p>

<p align="center">
  <img width="45%" src="docs/screenshots/desktop/pages/watchlist.webp" alt="Disscount - Product watchlist with price-drop targets"/>
  <img width="45%" src="docs/screenshots/desktop/pages/shopping-lists.webp" alt="Disscount - Shopping lists"/>
</p>

<p align="center">
  <img width="45%" src="docs/screenshots/desktop/pages/shopping-list-detail-items.webp" alt="Disscount - Shopping list items with quantities and per-item savings"/>
  <img width="45%" src="docs/screenshots/desktop/pages/shopping-list-detail-stores.webp" alt="Disscount - Shopping list basket totals per store chain"/>
</p>

<p align="center">
  <img width="45%" src="docs/screenshots/desktop/pages/digital-cards.webp" alt="Disscount - Digital loyalty cards"/>
  <img width="45%" src="docs/screenshots/desktop/settings/preference.webp" alt="Disscount - Preferences (nearby stores and locations)"/>
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

If Disscount saves you money, you can support its hosting and further development on Ko-fi. Disscount stays free whether or not you choose to contribute.

[![Podrži Disscount na Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/disscount)

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

Day to day, run Postgres in Docker and the frontend and backend natively, so both keep hot reload. The steps are below.

`docker compose up -d --build` with the root `docker-compose.yml` instead builds and runs the production images of the whole stack (copy `.env.example` to `.env` first). It has no hot reload, so use it only to try a production build locally.

### Prerequisites

- Node.js 24 LTS+ and pnpm
- Java 21 and Maven 3.9+
- Docker + Docker Compose (Postgres 17, the same major as dev and production)

### Startup flow

The backend and frontend share one PostgreSQL database: the backend owns the app tables (Hibernate `ddl-auto`), the frontend owns the better-auth tables (drizzle). Start the database, run the backend, then the frontend.

### 1. Database (PostgreSQL)

Set `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD` in the root `.env` (see `.env.example`), and reuse them in both env files below. Then start Postgres on `localhost:5432`, with its data in a Docker volume:

```bash
docker compose -f docker-compose.local-db.yml up -d --wait
```

Port 5432 must be free, so stop a system Postgres first (`sudo systemctl disable --now postgresql` on Ubuntu). To keep its data, dump each database with `pg_dump -Fc` before stopping it, then load it with `docker exec -i disscount-local-db-1 pg_restore -U <user> -d <database> --no-owner --no-acl < <file>.dump`.

### 2. Backend (Spring Boot)

```bash
cd backend
cp .env.example .env
```

Set in `backend/.env`:

- `SPRING_DATASOURCE_URL` (e.g. `jdbc:postgresql://localhost:5432/disscount`)
- `SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD`
- `BETTER_AUTH_JWKS_URI` (e.g. `http://localhost:3000/api/auth/jwks`)
- Optional, to see dev's product photos: `PHOTO_DIR` and `PUBLIC_PHOTO_DIR` (local folders) and `R2_PUBLIC_URL=https://images-dev.disscount.me`, then `scripts/copy-dev-photo-rows.sh` ([docs/PRODUCT-IMAGES.md](docs/PRODUCT-IMAGES.md#local-development))

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

The repo ships pre-configured MCP servers so an AI editor picks them up on clone, one file per tool: `.mcp.json` (Claude Code), `.cursor/mcp.json` (Cursor), `.vscode/mcp.json` (VS Code). Cursor and VS Code carry `context7`, `chrome-devtools`, `dokploy` and `sentry`; only `.mcp.json` adds `postgres` and `resend`.

| Server            | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| `context7`        | Up-to-date library docs                           |
| `postgres`        | Query a PostgreSQL database                       |
| `chrome-devtools` | Chrome DevTools debugging                         |
| `sentry`          | Error tracking (org scope)                        |
| `dokploy`         | Deploys, logs and schedules on the Dokploy server |
| `resend`          | Email sending, domains and logs                   |

`sentry` is scoped to the `disscount` org rather than one project, so it reaches both `disscount-frontend` and `disscount-backend`.

No secrets are committed: `sentry` and `resend` authenticate via browser OAuth on first use, and `context7` reads `CONTEXT7_API_KEY` from your environment (it still runs keyless if that is unset, at the lower anonymous rate limit), and `dokploy` reads `DOKPLOY_API_KEY` the same way. Export those keys from your shell profile rather than writing it into a config, and a clone works anywhere with no per-machine edit. Note that the VS Code file spells the references `${env:CONTEXT7_API_KEY}` and `${env:DOKPLOY_API_KEY}`, which is that editor's own syntax, while the other two take a bare `${CONTEXT7_API_KEY}`. Never put keys in these files - use env vars or your editor's secret store.

## Deployment

Disscount is self-hosted on a Hetzner VPS using [Dokploy](https://dokploy.com) (Docker Compose), with Traefik for routing and automatic Let's Encrypt TLS, and Cloudflare in front for DNS, CDN, and proxying. Production deploys automatically from the `main` branch, and a staging environment deploys from the `dev` branch, on every push. Runtime errors go to Sentry, and UptimeRobot polls `/health` with a public [status page](https://stats.uptimerobot.com/ej4ROz2eMo).

See [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) for the full infrastructure reference: architecture, environment variables, DNS and SSL, security, backups and restore, monitoring, and how to add more apps to the server.

## How to contribute

Contributions are welcome, whether it's a bug report, feature idea, documentation improvement or code change. See the **[Contributing guide](.github/CONTRIBUTING.md)** for how to report issues, set up your environment, and open a pull request.

Please also review our **[Code of Conduct](.github/CODE_OF_CONDUCT.md)**. To report a security vulnerability, follow the **[Security Policy](.github/SECURITY.md)** rather than opening a public issue.

Thank you for helping improve Disscount - every contribution helps!
