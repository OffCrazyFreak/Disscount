# Disscount: Digital Cards (Digitalne kartice)

The loyalty-card wallet. A user saves the plastic cards they already carry, and the app renders the barcode or QR on demand so the card can be scanned straight off the phone at the till.

Two things shape every decision in here:

1. **It is used in a shop.** Often in a basement with no signal, at a till, with someone waiting. So it works offline, it opens fast, and the code panel is built for a scanner rather than for looks.
2. **A card number is a secret.** It never reaches localStorage, never reaches a URL, and never reaches a search parameter.

## Table of contents

1. [Quick reference](#1-quick-reference)
2. [How a card flows through the system](#2-how-a-card-flows-through-the-system)
3. [The data model](#3-the-data-model)
4. [Codes: scanning in, drawing out](#4-codes-scanning-in-drawing-out)
5. [Stores: official chains and community names](#5-stores-official-chains-and-community-names)
6. [Colour and contrast](#6-colour-and-contrast)
7. [Images](#7-images)
8. [Offline](#8-offline)
9. [Key files](#9-key-files)
10. [Libraries](#10-libraries)
11. [What is automatic vs manual](#11-what-is-automatic-vs-manual)
12. [Gotchas and lessons learned](#12-gotchas-and-lessons-learned)
13. [Future improvements and TODOs](#13-future-improvements-and-todos)

---

## 1. Quick reference

| Thing             | Value                                                           |
| ----------------- | --------------------------------------------------------------- |
| Route             | `/digital-cards`, protected, in `PROTECTED_ROUTE_PREFIXES`      |
| Backend base path | `/api/digital-cards`, plus `/api/store-names`                   |
| Query key root    | `digitalCards`, persisted offline. Suggestions use `storeNames` |
| Modals            | `?modal=digital-card/new`, `/edit&id=`, `/view&id=`             |
| Barcode renderer  | `@bwip-js/browser`, synchronous, SVG                            |
| Scanner preset    | `all`, unlike products which lock to EAN                        |
| Bottom nav        | Fifth cell, long press opens a new card                         |
| PWA shortcut      | Second of three on Android, after Skeniraj                      |

---

## 2. How a card flows through the system

```mermaid
flowchart TD
    A[User taps Dodaj karticu] --> B[digital-card-modal]
    B --> C{How is the code entered?}
    C -->|Scanner icon| D[useCameraScanner preset all]
    C -->|Typed| E[codeValue field]
    D --> F[rawValue + format]
    F --> G[toCodeType maps format to our vocabulary]
    E --> H
    G --> H[code-preview draws it live]
    H --> I{bwip-js can encode it?}
    I -->|Yes| J[SVG preview]
    I -->|No| K[Large-print value + warning]
    B --> L[Submit]
    L --> M[Modal closes immediately]
    M --> N{Online?}
    N -->|Yes| O[POST /api/digital-cards]
    N -->|No| P[Mutation pauses in the offline queue]
    P -->|Reconnect| O
    O --> Q[Card appears in the grid]
    Q --> R[Tap a tile]
    R --> S[View modal: big code, wake lock on]
```

The submit path is worth understanding because it is not the obvious one. The modal **closes before the request finishes**. If the write then fails, the error is parked in `modal-error-bus`, the modal reopens, and the error is applied to the form. This is the same pattern shopping lists use, and it is why the wallet feels instant.

---

## 3. The data model

Backend entity `disscount.digitalCard.domain.DigitalCard`, table `digital_card`.

| Column                      | Type                   | Notes                                                                      |
| --------------------------- | ---------------------- | -------------------------------------------------------------------------- |
| `id`                        | UUID                   |                                                                            |
| `user_id`                   | UUID FK                | Lazy `@ManyToOne` to `app_user`                                            |
| `card_name`                 | varchar                | What the user calls it                                                     |
| `card_type`                 | varchar(16)            | `loyalty` / `gift` / `membership` / `other`. A plain String, never an enum |
| `store_name`                | varchar                | Free text, always set                                                      |
| `chain_code`                | varchar(40), nullable  | Set only when an official chain was picked                                 |
| `code_value`                | varchar(4096)          | The card number                                                            |
| `code_type`                 | varchar(32)            | Barcode Detection API format name, or `unknown`                            |
| `card_color`                | varchar(7)             | `#rrggbb`                                                                  |
| `icon_image`                | TEXT, nullable         | base64 data URI                                                            |
| `front_image`               | TEXT, nullable         | base64 data URI                                                            |
| `back_image`                | TEXT, nullable         | base64 data URI                                                            |
| `note`                      | varchar(500), nullable |                                                                            |
| `pinned_at`                 | timestamp, nullable    | Null means not pinned                                                      |
| `created_at` / `updated_at` | timestamp              | Stamped through `Timestamps.nowUtc()`                                      |
| `deleted_at`                | timestamp, nullable    | Soft delete                                                                |

**Why `card_type` is a String and not an enum.** The backend runs `ddl-auto=update`, which never drops anything. Turning a column into a Java enum makes Hibernate add a CHECK constraint; changing the vocabulary later leaves the old constraint behind, and every write that uses a new value fails with a 500. Same reasoning applies to `code_type`, which additionally must accept whatever a browser's Barcode Detection API decides to return, without needing a backend release.

**Why `pinned_at` is a timestamp and not a boolean.** It matches the rest of the codebase (`User`'s notification toggles, `ContactMessage.readAt`), and it records _when_, which a boolean throws away.

**Ownership.** Every id-addressed method goes through `findActiveByIdAndUser(cardId, user)`, so the ownership check is the query itself and cannot be forgotten in a service method. Do not copy `NotificationController`, which omits it.

---

## 4. Codes: scanning in, drawing out

### The vocabulary

`codeType` stores the **Barcode Detection API's own format names**: `ean_13`, `qr_code`, `code_128`, and so on. This is deliberate. The scanner already hands back exactly these strings, so a scan needs no translation on the way in.

There is one extra value, `unknown`, labelled **"Samo broj/tekst"** in the UI. It covers two cases: a membership number that has no barcode at all, and a value the chosen symbology cannot encode. Both render as large high-contrast text instead.

### Scanning

`useCameraScanner().openScanner({ preset: "all", onScan })` from `context/scanner-context.tsx`. The `all` preset accepts QR, Aztec, Codabar, Code 39/93/128, Data Matrix, ITF and PDF417 on top of the retail EAN/UPC formats. Products lock to `product` (EAN only); a loyalty card can carry anything.

`onScan` fills `codeValue` **and** `codeType` in one go, then the preview redraws.

### Drawing

`utils/generate-code-svg.ts` wraps `@bwip-js/browser`.

```ts
generateCodeSvg(codeValue, codeType);
// -> { ok: true, svg } | { ok: false, reason: "unsupported" | "invalid" }
```

It **never throws**. bwip-js rejects a value that does not fit its symbology (an EAN-13 needs twelve digits plus a checksum), and that is a normal thing for a user to do, not an exception. The caller renders the plain value instead.

Two details worth keeping:

- `includetext: false`. The human-readable line is our own HTML, which keeps user input out of the SVG string that gets injected with `dangerouslySetInnerHTML`.
- `CODE_TYPE_TO_BCID` maps our stored names to bwip-js encoder names. They are not the same: `itf` becomes `interleaved2of5`, `aztec` becomes `azteccode`, and `codabar` becomes `rationalizedCodabar`.

---

## 5. Stores: official chains and community names

A card carries **both** `storeName` (free text, always) and `chainCode` (nullable). Picking an official chain sets both; typing free text clears `chainCode`.

The autocomplete has two groups:

| Group             | Source                                                                 |
| ----------------- | ---------------------------------------------------------------------- |
| Službene trgovine | `cijeneService.useGetChainStats()`, labelled through `getChainLabel()` |
| Ostalo            | `GET /api/store-names`, the community suggestions                      |

### Community store names

When a user saves a card with free text and no chain code, that name is recorded in `store_name_suggestion` and offered to everyone else. The aim is to stop the same corner shop accumulating under five spellings.

The table **carries no user reference of any kind**. The list is public, so attribution must not be recoverable from it.

`normalized_name` is the dedupe key: lowercased, diacritics stripped, `đ` mapped to `d`, via `StoreNameNormalizer`, mirroring the frontend's `normalizeForSearch`.

`usage_count` is a **monotonic submission count**, not a live count of cards using the name. It is never decremented on delete. It only orders the list, and a live count would need decrements, orphan cleanup and a backfill for no visible gain.

---

## 6. Colour and contrast

Every card has a colour, and the colour backs text, so contrast is a correctness problem rather than a styling one.

Colours are generated at one fixed saturation and lightness, so the wallet reads as one designed set. **That alone does not make white text legible.** Yellow and green are far brighter than blue at the same lightness: hue 55 lands near `#aea229`, which is about 2.7:1 against white, well under the 4.5:1 minimum. Several curated chain brand colours are just as light.

Two rules fix it together:

1. **`foregroundFor(hex)`** picks white or a dark ink per card, whichever wins on contrast. This covers the freeform hue slider and the brand colour map with one rule.
2. **`hexForHue(hue)`** darkens a hue until one of the two inks clears 4.5:1. A band around cyan sits in a dead zone where neither ink passes at the base lightness; those hues step down a couple of points. Worst case across all 360 hues is 4.52:1.

The colour is suggested, in this order, and only until the user touches the picker:

1. The chain's brand colour, from `CHAIN_BRAND_COLORS`.
2. The dominant colour of an uploaded icon or front image, from `extractDominantColor`.

A manual pick wins permanently. Resetting the form restores the suggestions.

---

## 7. Images

Three optional base64 images: `iconImage` (256px), `frontImage` and `backImage` (1024px). The card faces are the backup when a generated code will not scan, so the cashier can read the number or barcode off the photo.

All three go through **`resizeImageToWebp`**, the same compressor the settings avatar uses. Nothing here rolls its own. EXIF orientation is handled for free, because `createImageBitmap` applies it by default, which matters when the photo came from a phone held in portrait.

Images live **outside react-hook-form** in `use-card-images.ts`, exactly like the settings avatar field, for two reasons: a base64 image would blow the localStorage draft quota, and it does not belong in dirty tracking. The modal merges them back in on submit and folds their dirty flag into the shell's indicator.

The colour sampler receives the **compressed output**, not the original file. Passing the original meant decoding a possibly 12-megapixel photo a second time, right after the compressor had already decoded it.

---

## 8. Offline

Offline is the whole point, so both halves are wired.

**Reads.** `digitalCards` and `storeNames` are in `PERSISTED_QUERY_KEY_PREFIXES` in `lib/offline/cached-query-keys.ts`, so the wallet and the autocomplete survive a reload with no signal.

**Writes.** Four mutations are registered in `lib/offline/offline-mutations.ts` so a reload can replay them: create, update, delete and pin. Each needs four things kept in sync, and missing one fails quietly:

1. A key in `OFFLINE_MUTATION_KEYS`.
2. That key as `mutationKey` on the hook.
3. A `defineOfflineMutation` registration with the raw query function.
4. The raw query function exported from `lib/api/digital-cards`.

Create, update and pin also pass an `onError` handler. A reload loses the `onError` given at `mutate()` time, and those three have no modal left to show an error in, so without it a failed replay reverted in silence. Delete does not pass one, because its only caller already toasts.

There is **no `GET /api/digital-cards/{id}`**. The view and edit modals select the card out of the `["digitalCards", "me"]` cache through `useDigitalCard(id)`. This is what makes a deep link work offline: a by-id fetch would have no cache entry to fall back on.

---

## 9. Key files

### Frontend, feature

| Path                                                    | Role                                                      |
| ------------------------------------------------------- | --------------------------------------------------------- |
| `app/(user)/digital-cards/page.tsx`                     | Server component, reads `?q=`                             |
| `components/digital-cards-client.tsx`                   | Auth gate, search, sort, the three body states            |
| `components/digital-card-tile.tsx`                      | The 3:2 tile, flip container, overlay open button         |
| `components/card-face-front.tsx` / `card-face-back.tsx` | The two faces                                             |
| `components/card-code.tsx`                              | Renders the SVG or the large-print fallback               |
| `components/card-icon.tsx`                              | Icon fallback chain: image, chain logo, initials, generic |
| `components/forms/digital-card-modal.tsx`               | Create and edit, drafts, retry, colour suggestions        |
| `components/forms/store-name-field.tsx`                 | The grouped autocomplete                                  |
| `components/forms/code-field.tsx`                       | Input plus the scanner button                             |
| `components/forms/color-picker/`                        | Three variants behind a temporary switcher                |
| `components/view/digital-card-view-modal.tsx`           | The till view, holds the wake lock                        |
| `components/view/card-code-panel.tsx`                   | Forced-white high-contrast code panel                     |
| `utils/card-colors.ts`                                  | Palette, brand map, contrast helpers                      |
| `utils/generate-code-svg.ts`                            | The bwip-js boundary                                      |
| `utils/card-sorting.ts`                                 | Six comparators plus the pinned split                     |
| `hooks/use-card-images.ts`                              | The three images, outside RHF                             |

### Frontend, shared

| Path                                                  | Role                                                |
| ----------------------------------------------------- | --------------------------------------------------- |
| `constants/card-codes.ts`                             | `CARD_TYPES`, `CODE_TYPES`, `SCANNABLE_CODE_TYPES`  |
| `lib/api/digital-cards/{keys,queries,hooks,index}.ts` | Service layer                                       |
| `lib/api/store-names/`                                | Suggestion service                                  |
| `lib/modal/modal-retry-bus.ts`                        | In-memory stash for values that must not touch disk |
| `hooks/use-wake-lock.ts`                              | Screen wake lock, shared                            |
| `utils/browser/extract-dominant-color.ts`             | Dominant hue of an image                            |
| `utils/browser/image.ts`                              | `resizeImageToWebp`, shared with the avatar         |

### Backend

| Path                                                    | Role                                               |
| ------------------------------------------------------- | -------------------------------------------------- |
| `disscount/digitalCard/domain/DigitalCard.java`         | Entity                                             |
| `disscount/digitalCard/dao/DigitalCardRepository.java`  | `findActiveBy...` JPQL                             |
| `disscount/digitalCard/service/DigitalCardService.java` | CRUD, pin, suggestion recording                    |
| `disscount/digitalCard/rest/DigitalCardController.java` | `/api/digital-cards`                               |
| `disscount/storeName/`                                  | Suggestion entity, normalizer, service, controller |

---

## 10. Libraries

| Library                    | Version          | Used for                                     |
| -------------------------- | ---------------- | -------------------------------------------- |
| `@bwip-js/browser`         | `^4.11.2`        | Drawing barcodes and QR as SVG               |
| `@yudiel/react-qr-scanner` | `^2.6.0`         | The camera scanner                           |
| `barcode-detector`         | `^3.2.1`         | Format names and the still-image decode path |
| `react-hook-form`          | `^7.68.0`        | The card form                                |
| `zod`                      | `^4.1.13`        | Request, form and DTO schemas                |
| `@tanstack/react-query`    | `^5.90.12`       | Caching and the offline mutation queue       |
| `motion`                   | `^12.23.26`      | The staggered grid reveal                    |
| Spring Boot                | `3.1.0`, Java 21 | Backend                                      |

No colour picker library. The picker is swatches plus a styled range input, roughly forty lines, and adding one would have been more code than writing it.

---

## 11. What is automatic vs manual

| Concern                | Automatic                                      | Manual                                             |
| ---------------------- | ---------------------------------------------- | -------------------------------------------------- |
| Chain list             | Pulled from the price API and cached six hours | Adding a logo PNG to `public/store-chains/`        |
| Chain brand colour     | Suggested on pick                              | Curating `CHAIN_BRAND_COLORS` by hand              |
| Card colour legibility | `foregroundFor` picks the ink per card         | Nothing                                            |
| Code type after a scan | Filled from the detected format                | Correcting it if the scanner guessed wrong         |
| Offline reads          | Persisted by the key allowlist                 | Adding a new query root to that allowlist          |
| Offline writes         | Replayed on reconnect                          | The four-step registration per mutation            |
| Community store names  | Recorded on save, offered to everyone          | Moderation, which does not exist yet               |
| PWA shortcut           | Emitted from the nav item                      | Generating the icon PNGs and picking the top three |
| Schema changes         | `ddl-auto=update` adds columns                 | Dropping or renaming anything, by hand, in SQL     |

---

## 12. Gotchas and lessons learned

**bwip-js does not tree shake.** The docs say per-symbology imports keep the bundle small. They do not: BWIPP is one generated blob, so importing thirteen encoders costs the same as importing all hundred. Measured at 844 KB raw, 210 KB gzipped, confirmed by finding unimported symbologies in the build output. Webpack does scope it to the `/digital-cards` route chunk, so no other page pays for it. `generateCodeSvg` is deliberately synchronous, because every tile draws a code and a lazy import would only move the same download behind a loading state.

**Codabar's export is `rationalizedCodabar`.** And the `bcid` option must be the bwip-js encoder name, not the scanner's format string. Both were wrong first time and only the compiler caught the first one.

**Module-scope constants have a dead zone.** `CARD_SWATCHES` calls `hexForHue` while the module is still evaluating, and `hexForHue` now needs the ink constants. A `const` declared below would be read in its temporal dead zone and throw at import time, taking the whole page with it. Contrast helpers therefore sit **above** `hexForHue` in `card-colors.ts`, and moving them will break the page rather than fail a test.

**The entity outlet stays mounted between openings.** So a modal reached twice with different ids reuses the instance. The card form's draft merge bails out while the form is dirty, which meant editing card A, closing, then opening card B showed A's edits under B's title. Both card modals are keyed by id in `entity-modal-outlet.tsx`. Add-to-list and watchlist carry the same fix for the same reason.

**A card code must never reach disk, but must survive a retry.** These pull in opposite directions. The rule that reconciles them: never on disk, fine in memory until the submit settles. `codeValue` is in `useFormDraft`'s `exclude`, and a failed optimistic save stashes it in `modal-retry-bus`, an in-memory sibling of the error bus that dies with the tab. Drafts written by older builds are deleted outright rather than sanitised, because their shape came from a build we no longer have.

**A card code must never reach a URL either.** The page search filters on `cardName`, `storeName` and `note` only. Adding `codeValue` would put card numbers into `?q=`, into history, and into anything that reads either.

**`ddl-auto=update` never drops anything.** Production still held the pre-rework `digital_card` table, whose columns did not match. It had to be dropped by hand before deploying, or the new schema would have merged into the stale columns and the new `NOT NULL` columns would have failed against existing rows.

**Recording a store name must not poison the card save.** `StoreNameSuggestionService.record()` runs inside the card-save transaction. A concurrent insert colliding on the unique `normalized_name` marks that transaction rollback-only **even when the exception is caught**, so the card save would fail for an unrelated reason. `@Transactional(propagation = REQUIRES_NEW)` gives it its own transaction, and it swallows and logs. It is called from a different bean, which is what makes the proxy apply the annotation at all: a self-invocation would silently skip it.

**The specular sheen is not decoration.** A flat coloured div does not read as a card. The diagonal band, the light-catching top edge and the raised icon medallion are what sell it at tile size, and the band softens on light cards where it would otherwise read as glare.

**Reduced motion has to gate the transform, not just the transition.** Gating only the transition leaves a reduced-motion user with an instant snap to the flipped state, which is worse than no flip. Tailwind's `hover:` variant already wraps in `@media (hover: hover)`, so a tap never triggers the flip on touch.

---

## 13. Future improvements and TODOs

- [ ] **Pick one colour picker.** Three variants ship behind a temporary switcher (`color-picker-switcher.tsx`, labelled privremeno) so they can be compared in the running app. Deleting the two losers and the switcher is a follow-up.
- [ ] **Migrate to the newer data-fetching conventions.** Digital cards is the last domain still on `useGetCurrentUserDigitalCards` rather than `queryOptions()` descriptors, `useAuthedQuery` and `AsyncSection`, and it has no colocated skeletons or `loading.tsx`. Blocked on the loading-system PR landing.
- [ ] **Moderate community store names.** The entity already carries `hidden_at` for it. Admin needs to list, hide, restore, rename and merge, following `AdminContactController`, with `requireAdmin` called inside the service rather than the controller. A `merged_into_id` column comes with it.
- [ ] **Raise `MIN_PUBLIC_USAGE` to 2.** It is 1 so the suggestion group is not empty at launch. Two is better for typo hygiene once there is volume.
- [ ] **Onboarding v2 should nudge saving a card**, seeded from the chains the user pins in preferences. Suggest, never require. TODO sits in `onboarding-steps.ts`.
- [ ] **Consider scrubbing card codes from Sentry.** Share tokens already have `scrub-share-token.ts` because they are secrets; a card code is a secret in the same way. Needs a look at whether one can actually reach a breadcrumb first.
- [ ] **Export and import cards**, so a phone change does not mean retyping the wallet.
- [ ] **Loyalty prices.** The long game: if the chains ever expose them, a card links a user to the prices that only apply with it, which then reaches the product card, the shopping list total and the best-store calculation.
- [ ] **`GET /api/digital-cards/{id}`** if a card ever needs to be reachable by someone who is not its owner. Today the absence is a feature, not a gap.
