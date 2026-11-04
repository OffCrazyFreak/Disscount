# Docs index

Reference documentation for Disscount. Each file is a standalone deep-dive into one part of the system. A "Key files" section lists only the files whose role is not obvious from the name or that sit outside the feature folder.

- [INFRASTRUCTURE.md](INFRASTRUCTURE.md) - infrastructure, env vars, DNS/SSL, backups, monitoring.
- [AUTH.md](AUTH.md) - auth architecture (better-auth IdP + Spring resource server, URL-modal flow, mandatory onboarding).
- [PWA.md](PWA.md) - PWA setup, service worker, offline behaviour, install flow.
- [SHOPPING-LISTS.md](SHOPPING-LISTS.md) - shopping lists: data model, merging duplicates, ticking with captured prices, optimistic writes and the offline queue, grouping by store and the map link, the stores tab, the price history chart.
- [SHARING.md](SHARING.md) - shopping list sharing: link access levels, sharing by list id, the one route that serves owners and link visitors.
- [MOBILE-NAV.md](MOBILE-NAV.md) - mobile bottom nav bar, long-press gestures, tab scrubbing, the shared sheet shell.
- [STATE-PERSISTENCE.md](STATE-PERSISTENCE.md) - how inputs and forms remember state (URL, localStorage drafts, IndexedDB).
- [MAP.md](MAP.md) - the stores map: store-location sync (chain locators, DGU register, geocoders), the map page, URL state, accessibility.
- [STORE-HOURS.md](STORE-HOURS.md) - store opening hours: the weekly template and dated layers, the Sunday and holiday rules, the one open-at-time function, the API.
- [I18N.md](I18N.md) - languages, locale routing, message catalogs, backend messages and translated emails.
- [SEARCH.md](SEARCH.md) - the shared matcher, diacritic folding, ranking, Croatian collation, and why there is no search library.
- [LANDING.md](LANDING.md) - landing page composition, server-vs-client rendering, SEO, fonts.
- [BRAND.md](BRAND.md) - brand image system (logo, favicon, PWA icons, splash screens, social kit).
- [PRODUCTS.md](PRODUCTS.md) - product data from the cijene API: the proxy, the server rendered product page, SEO, prices, price history, watchlist alerts, shopping list rows, offline.
- [PRODUCT-IMAGES.md](PRODUCT-IMAGES.md) - product photos: Open Food Facts and user sources, storage on the server's disk, rendering, delivery, the admin review queue, failure modes.
- [DIGITAL-CARDS.md](DIGITAL-CARDS.md) - the card wallet: data model, API, photos, offline queueing, scanner hardening, barcode rendering, privacy.
- [IMAGE-UPLOADS.md](IMAGE-UPLOADS.md) - how avatars, card photos and product photos are resized, stripped of metadata and checked on the server.
- [API-CONTRACT.md](API-CONTRACT.md) - the committed contract that holds the zod schemas and the backend DTOs and enums to each other in CI, and how to refresh it.
- [TESTING.md](TESTING.md) - the Vitest setup: Node and jsdom projects, shared helpers, MSW, what to test and what is left to a browser.
- [WATCHLIST.md](WATCHLIST.md) - the watchlist: stored rules, browser-side price alerts, the bell and the price drop badge, suggestions, offline.
- [SCANNER.md](SCANNER.md) - the barcode scanner: callers and presets, camera picking, photo scanning, feedback, CSP and the WebAssembly decoder.
- [SETTINGS.md](SETTINGS.md) - Postavke: the four tabs, the long-lived form and its parallel saves, Sigurnost, and what account deletion erases and keeps.
- [ADMIN.md](ADMIN.md) - the admin dashboard: who sees it, how `/api/admin/**` is checked, the users, contact and photo tabs.
- [BACKEND-PROXY.md](BACKEND-PROXY.md) - the Next.js proxy that turns the session cookie into a per-request backend token.
- [SUPPORT.md](SUPPORT.md) - Ko-fi support flow, GitHub funding links, and future recognition rules.
