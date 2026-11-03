# Docs index

Reference documentation for Disscount. Each file is a standalone deep-dive into one part of the system.

- [INFRASTRUCTURE.md](INFRASTRUCTURE.md) - infrastructure, env vars, DNS/SSL, backups, monitoring.
- [AUTH.md](AUTH.md) - auth architecture (better-auth IdP + Spring resource server, URL-modal flow, mandatory onboarding).
- [PWA.md](PWA.md) - PWA setup, service worker, offline behaviour, install flow.
- [SHARING.md](SHARING.md) - shopping list sharing: link access levels, sharing by list id, the one route that serves owners and link visitors.
- [MOBILE-NAV.md](MOBILE-NAV.md) - mobile bottom nav bar, long-press gestures, tab scrubbing, the shared sheet shell.
- [STATE-PERSISTENCE.md](STATE-PERSISTENCE.md) - how inputs and forms remember state (URL, localStorage drafts, IndexedDB).
- [MAP.md](MAP.md) - the stores map: store-location sync (chain locators, DGU register, geocoders), the map page, URL state, accessibility.
- [I18N.md](I18N.md) - languages, locale routing, message catalogs, backend messages and translated emails.
- [SEARCH.md](SEARCH.md) - the shared matcher, diacritic folding, ranking, Croatian collation, and why there is no search library.
- [LANDING.md](LANDING.md) - landing page composition, server-vs-client rendering, SEO, fonts.
- [BRAND.md](BRAND.md) - brand image system (logo, favicon, PWA icons, splash screens, social kit).
- [PRODUCTS.md](PRODUCTS.md) - product data from the cijene API: the proxy, the server rendered product page, SEO, prices, price history, watchlist alerts, shopping list rows, offline.
- [PRODUCT-IMAGES.md](PRODUCT-IMAGES.md) - product photos: Open Food Facts and user sources, the public R2 bucket, rendering, delivery, the admin review queue, failure modes.
- [DIGITAL-CARDS.md](DIGITAL-CARDS.md) - the card wallet: data model, API, R2 photos, offline queueing, scanner hardening, barcode rendering, privacy.
- [IMAGE-UPLOADS.md](IMAGE-UPLOADS.md) - how avatars, card photos and product photos are resized, stripped of metadata and checked on the server.
- [TESTING.md](TESTING.md) - the Vitest setup: Node and jsdom projects, shared helpers, MSW, what to test and what is left to a browser.
- [SUPPORT.md](SUPPORT.md) - Ko-fi support flow, GitHub funding links, and future recognition rules.
