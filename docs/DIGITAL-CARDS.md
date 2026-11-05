# Disscount: Digital Cards (Kartice)

A reference for how the digital wallet works: how a card is created, stored, shown at the till, kept offline, and deleted. Written for someone new to the code, so the concepts are explained as they come up. Keep it up to date as the feature changes.

_Written against the `feat/digital-cards-rebuild` branch. This is the rebuild; the earlier `digital_card` feature is replaced and not described here._

> **Mental model in one sentence:** a card is a small row of text (name, store, the number or barcode payload, a colour) that the browser can draw as a scannable barcode on a white panel, optionally with up to three photos kept on the server's disk, and every write works offline because the card id is made on the phone and the write is replayed later.

---

## 1. Quick reference

| Thing           | Value                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| Route           | `/digital-cards` (login required), plus the modals `?modal=digital-card/new`, `edit&id=`, `view&id=`   |
| Backend package | `disscount.digitalCard` (cards, photos), `disscount.storeName` (community store-name list)             |
| Tables          | `wallet_card`, `wallet_card_photo`, `store_name_suggestion`, `store_name_usage`, `photo_cleanup`       |
| Limits          | 300 active cards per user, 60 characters for names, 500 for a note, 4096 for a code                    |
| Photos          | up to 3 per card (`front`, `back`, `icon`), WebP or JPEG, 512 KB per part, stored on the server's disk |
| Photo folder    | `cards/` in `PHOTO_DIR`, the `photos-private` volume at `/data/photos-private`                         |
| Env vars        | `PHOTO_DIR` (backend, optional)                                                                        |
| No env vars set | the wallet still works; only photos are off (uploads answer 503, the form hides the photo fields)      |
| Offline         | cards are cached on the device; create, edit, pin, archive and delete queue and replay                 |
| Frontend tests  | `pnpm test` (Vitest)                                                                                   |
| Backend tests   | `mvn -B test` (H2, no network)                                                                         |

**Daily workflow:** nothing to configure for cards themselves. Photos need `PHOTO_DIR` in Dokploy; see [§13](#13-config-and-env-vars).

---

## 2. How a card flows

```mermaid
flowchart TD
    A[User taps Dodaj karticu, or long-presses Kartice] --> B[Form modal opens]
    B -->|scan| S[Scanner with confirm step]
    B -->|type| F[Fill the form]
    S --> F
    F --> G[crypto.randomUUID makes the card id]
    G --> H[Optimistic patch of the cached card list, modal closes]
    H -->|online| P["PUT /api/digital-cards/{id}"]
    H -->|offline| Q[Mutation paused, stored in IndexedDB]
    Q -->|back online| P
    P --> R[Photo upload, if any]
    R -->|offline| O[Photo outbox in IndexedDB]
    O -->|after the save replays| R
    P --> V[Tile on /digital-cards]
    V -->|tap| W[View modal: barcode on a white panel]
    W --> U[recordCardUsed queues last-used time]
    U -->|at most once a minute and on tab hide| X["POST /api/digital-cards/used"]
```

Step by step:

1. **Create.** The form (`?modal=digital-card/new`) mints the card id in the browser with `crypto.randomUUID()`. Because the id exists before the server has seen the card, an offline create and a later edit of the same card replay in order with no temporary ids to rewrite.
2. **Save.** `PUT /api/digital-cards/{id}` is an idempotent upsert: the same request sent twice gives one card. The modal closes immediately on an optimistic patch of the cached list, and if the server later refuses the write the modal reopens with the error (the card number is kept in memory for that, see [§10](#10-privacy)).
3. **Photos.** Photos are separate requests after the card exists, so a slow upload never blocks saving the card.
4. **Show.** Tapping a tile opens the view modal, which draws the barcode as an SVG on a white panel and keeps the screen awake.
5. **Use.** Opening a card records a "last used" time locally. It is sent in batches, never on the critical path.

---

## 3. Data model

Backend entities live in `backend/src/main/java/disscount/digitalCard/domain/` and `.../storeName/domain/`. The tables are new names on purpose: the old `digital_card` table cannot merge into the new shape (see [§17](#17-gotchas--lessons-learned)).

### `wallet_card` (entity `DigitalCard`)

| Column                                     | Type                      | Notes                                                                                                                                |
| ------------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                       | UUID, primary key         | Generated by the client, no `@GeneratedValue`                                                                                        |
| `user_id`                                  | UUID, FK `app_user`       | Not null, lazy, indexed (`idx_wallet_card_user`)                                                                                     |
| `card_name`                                | varchar(60)               | Not null                                                                                                                             |
| `card_type`                                | varchar(16)               | `loyalty`, `gift`, `membership`, `other`. A String, never a Java enum                                                                |
| `store_name`                               | varchar(60)               | Always set, also for official chains                                                                                                 |
| `chain_code`                               | varchar(40), nullable     | Only set when an official chain was picked; pattern `^[a-z0-9_-]+$`                                                                  |
| `code_value`                               | varchar(4096)             | The printed card number or text                                                                                                      |
| `barcode_value`                            | varchar(4096), null       | The barcode payload, only when it differs from `code_value`                                                                          |
| `code_type`                                | varchar(32)               | A BarcodeDetector format name (`ean_13`, `qr_code`, `code_128`, and so on) or `unknown` for a number with no bars                    |
| `card_color`                               | varchar(7)                | `#RRGGBB`                                                                                                                            |
| `note`                                     | varchar(500), null        |                                                                                                                                      |
| `valid_from`, `expires_on`                 | date, null                | `expires_on` may not be before `valid_from`                                                                                          |
| `balance`, `balance_unit`                  | numeric(19,4), varchar(8) | Unit is an ISO 4217 code like `EUR`; null unit means points                                                                          |
| `pinned_at`, `last_used_at`, `archived_at` | timestamp, null           | Null means "not pinned / never used / not archived"                                                                                  |
| `created_at`, `updated_at`                 | timestamp                 | Stamped through `Timestamps.nowUtc()`, never `LocalDateTime.now()`. `updated_at` moves only on an edit, never on pin, archive or use |
| `deleted_at`                               | timestamp, null           | Soft delete marker                                                                                                                   |

Deliberately **not stored**: a gift card PIN (it is a credential), the header text colour (derived from the card colour), and card groups.

### `wallet_card_photo` (entity `DigitalCardPhoto`)

One row per photo. Columns: `id` (generated UUID), `card_id` (FK), `slot` (`front`, `back`, `icon`), `sha256` (char 64), `full_key`, `thumb_key` (null for the icon), `content_type`, `byte_size`, `created_at`. The pair `(card_id, slot)` is unique (`uq_wallet_card_photo_slot`), so a slot holds one photo and a new upload replaces it.

### `photo_cleanup` (entity `PhotoCleanup`)

A queue of photo deletes that still have to happen. Columns: `id`, `key_or_prefix` (a file key, or a `cards/...` prefix when `is_prefix` is true), `is_prefix`, `created_at`.

- The row is written in the same transaction as the database delete it belongs to (card delete, photo replace or remove, account deletion, the 30-day purge), so the two commit or roll back together.
- After the commit `PhotoCleanupService` tries the delete and removes the row on success. On failure the row stays.
- Every upload gets its own key (a random upload id after the hash), so a queued delete of an earlier upload can never remove a newer one, even one with the same bytes. As a second guard, writing a photo row cancels any queued delete for its keys, and every delete attempt skips (and drops) a key that a live photo row still uses.
- `DigitalCardCleanupJob.retryPhotoCleanup` retries the oldest 200 rows every 15 minutes. With photos disabled (no `PHOTO_DIR`, or no `cards/` folder) nothing is deleted and the rows stay queued until storage is configured. With storage off, a card delete or purge writes its prefix row only when a photo row still points under it (a photo stored before storage was switched off), so cards without stored photos queue nothing; callers therefore queue before they delete the photo rows. Single key deletes and the account erasure prefix always queue, so an erased account also reaches objects a failed discard left without a row.

### `store_name_suggestion` (entity `StoreNameSuggestion`)

The shared, anonymous list of store names that people typed when their store is not an official chain. Columns: `id`, `name`, `normalized_name` (unique), `use_count`, `hidden`, `created_at`, `updated_at`. There is **no user column**: the list is public and carries no link back to who typed a name.

A private companion table, `store_name_usage` (entity `StoreNameUsage`: `id`, `user_id`, `suggestion_id`, `created_at`, unique on `user_id` and `suggestion_id`), records which accounts used a name so `use_count` counts distinct people. It is never exposed by any endpoint, and account deletion removes the account's rows and lowers the counts. Suggestions that existed before this table keep their old counts.

- `StoreNameNormalizer.normalize` lowercases, strips diacritics and maps `đ` to `d`, so "Žabac" and "zabac" are one entry.
- `StoreNameService.record` runs in its own transaction (`REQUIRES_NEW`) so a concurrent duplicate insert can never roll back the card save, and `DigitalCardService` catches and logs a failure there instead of failing the card.
- A name is recorded after the card commits, and only when the card has no `chainCode` and is new, has a changed store name, or was a chain card that became custom. Plain edits and replays do not count.
- A name is shown (in search and in the top list) only once `use_count >= 2`, that is two different accounts, so one person's custom store never leaks however many of their cards use it.
- `hidden` exists for moderation; nothing sets it yet (see [§18](#18-future-improvements--todos)).

---

## 4. API

All card endpoints need a valid JWT. Errors are RFC 9457 `ProblemDetail` bodies whose messages are `error.card*` and `validation.card.*` codes resolved in the request's language (see [I18N.md](I18N.md#backend)). Swagger UI at `/api-docs` lists them.

| Method and path                                | What it does                                                                                                                                                                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/digital-cards/me`                    | Every non-deleted card of the caller, archived ones included, each with `photos: [{slot, sha256}]`                                                                                                                               |
| `GET /api/digital-cards/{id}`                  | One card                                                                                                                                                                                                                         |
| `PUT /api/digital-cards/{id}`                  | Create or update (idempotent upsert). Another user's id, or a soft-deleted id, answers 404, so a replayed create cannot resurrect a deleted card                                                                                 |
| `PUT /api/digital-cards/{id}/pin`              | Body `{pinned}`. A small write so an offline pin toggle never overwrites a full edit. A bulk update, so it does not bump `updated_at` (a pin is not an edit and must not move the card in "Nedavno uređeno")                     |
| `PUT /api/digital-cards/{id}/archive`          | Body `{archived}`, same reasons, and likewise leaves `updated_at` alone                                                                                                                                                          |
| `DELETE /api/digital-cards/{id}`               | Soft delete. The photo rows go at once and the file deletes are queued in `photo_cleanup`, because photos are personal data. 204; unknown id 404                                                                                 |
| `POST /api/digital-cards/used`                 | Body `[{id, usedAt}]`, 1 to 50 entries (otherwise 400). `usedAt` is clamped to between 400 days ago and now. Sets `last_used_at` to the later of the stored and sent time, without bumping `updated_at`. 204                     |
| `GET /api/digital-cards/config`                | `{photosEnabled}`. The form shows the photo fields only once this answers `true`, so they stay hidden while it loads or fails                                                                                                    |
| `PUT /api/digital-cards/{id}/photos/{slot}`    | Multipart: `full` (required) and `thumb` (required for `front` and `back`, absent for `icon`). Returns `{slot, sha256}`                                                                                                          |
| `GET /api/digital-cards/{id}/photos/{slot}`    | Streams bytes. Query `size=full\|thumb` and `v={sha256}`. `Cache-Control: no-store, private`, an `ETag`, and `nosniff`. Conditional GET goes through `WebRequest.checkNotModified`, so weak and multi-value `If-None-Match` work |
| `DELETE /api/digital-cards/{id}/photos/{slot}` | Removes one photo; the file delete is queued in `photo_cleanup`. 204                                                                                                                                                             |
| `GET /api/store-names?q=`                      | Up to 50 visible community names, most used first, matched on the normalized name                                                                                                                                                |

**Validation** (`DigitalCardRequest`): `cardName` and `storeName` 2 to 60 characters after trimming (`@TrimmedLength`, reported as field errors), `cardType` and `codeType` from an allowlist, `codeValue` 1 to 4096, `barcodeValue` up to 4096, `cardColor` a hex colour, `note` up to 500, `balance` 0 to 1,000,000 with two decimals, `balanceUnit` three capital letters, `expiresOn` not before `validFrom`. `cardName`, `storeName`, `codeValue`, `barcodeValue` and `note` may not contain a NUL character (a `@Pattern` on each field), and `GET /api/store-names?q=` with a NUL answers 400. The `POST /used` size and entry checks run through `@Validated` on the controller, and `GlobalExceptionHandler` turns the `ConstraintViolationException` into a 400.

**Limits:** 300 active cards per user (409 "Imaš već najveći dopušteni broj kartica. Obriši neku koju ne koristiš."; archived cards count toward it), exact even under concurrent requests because every card write first locks the user's `app_user` row (see [§5](#5-photos)); `POST /used` accepts 1 to 50 entries; photo uploads are limited to 20 per minute per user (429 with a `Retry-After` header, in memory per instance, the `cardPhotoUploadLimiter` bean in `config/UploadLimitConfig.java`). When photo storage is off the upload answers 503 "Slike trenutno nisu dostupne" with `code` `error.cardPhoto.unavailable` (every 503 problem carries its message code, since the detail is translated).

---

## 5. Photos

Photos are optional and sit behind a `PhotoStore` interface (`put`, `get`, `delete`, `deletePrefix`). Two implementations exist, chosen in `storage/PhotoStoreConfig`, which builds the product photo stores from the same classes: `FilesystemPhotoStore` when `PHOTO_DIR` is set (files under `cards/` in that directory; off while the folder is missing, see [PRODUCT-IMAGES.md](PRODUCT-IMAGES.md#storage-on-the-servers-disk)), otherwise `DisabledPhotoStore`, and the wallet then works without photos.

### What the browser does

`utils/browser/card-image.ts` prepares every image before upload, using the shared steps in `utils/browser/image.ts` ([IMAGE-UPLOADS.md](IMAGE-UPLOADS.md) covers every upload in the app):

- Decode with `createImageBitmap(file, { imageOrientation: "from-image" })` so phone photos are rotated correctly.
- `front` and `back`: 1280 px on the long edge plus a 320 px thumbnail. `icon`: a centred 128 px square. Small images are never upscaled.
- Encode WebP at quality 0.75. If the browser returns anything that is not `image/webp`, encode JPEG at 0.78 instead. This matters on Safari, see [§17](#17-gotchas--lessons-learned). PNG is never sent. The JPEG fallback paints a white background first, so transparency does not turn black.
- If the full image is over 480 KB after encoding, it is retried at quality 0.65, then 0.55, then at a 1024 px long edge. If it still does not fit, the error "Slika je prevelika. Odaberi drugu." is shown.

### What the server does

`PhotoValidator` accepts only WebP and JPEG, decided by the first bytes of the file and never by the client's `Content-Type` or file name. It uses no image library for WebP.

| Check      | Rule                                                                                                                                                                                                                                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Size       | 512 KB per part. Spring is set to `max-file-size=512KB` and `max-request-size=1100KB`                                                                                                                                                                                                                                             |
| Type       | JPEG (`FF D8 FF`) or WebP (`RIFF`, correct size, `WEBP`, first chunk `VP8 `, `VP8L` or `VP8X`). PNG, SVG and anything else answer 400                                                                                                                                                                                             |
| Dimensions | Read from the header, at most 2048 px per side, before anything is decoded                                                                                                                                                                                                                                                        |
| Animation  | `ANIM` and `ANMF` chunks are rejected                                                                                                                                                                                                                                                                                             |
| Alpha      | An `ALPH` chunk is allowed only after `VP8X`, only once, and before the `VP8 ` frame, and never together with `VP8L` (which carries its own alpha). Anything else answers 400                                                                                                                                                     |
| Metadata   | WebP is rewritten keeping only `VP8X` (flags cleared except alpha), `VP8 `, `VP8L` and `ALPH`, which drops EXIF, XMP and ICC. JPEG is decoded with ImageIO and re-encoded, which drops metadata, at the first quality from 0.85 down to 0.50 that is no bigger than the upload; the 512 KB limit also applies to the stored bytes |

The stored bytes are the sanitized ones. For `icon` the `sha256` is the hash of those bytes. For `front` and `back` it is a hash of the full and the thumbnail hashes together, so replacing only the thumbnail still changes the key, the `ETag` and the `?v=` value.

### Write order and the per-user lock

Upload validates both parts, writes them to disk **outside any transaction** (so no database connection is held while the files are written), and only then writes the row in a short transaction (`CardPhotoWriter`). That transaction re-checks that the card is still active, so a delete that committed during the upload wins. If the row write fails, the objects just stored are deleted, unless the live row already references the same keys (the same bytes uploaded twice).

Every card write (upsert, delete, pin, archive, photo replace and remove, account deletion) first takes `UserRepository.findByIdForUpdate` (`PESSIMISTIC_WRITE`), wrapped by `CardUserLock` (through `requireActiveForUpdate`), which also rejects a deleted user. That serializes one user's writes, which is what makes the 300-card limit exact and turns a concurrent replay of the same id into a plain update. Account deletion takes the lock and flushes the anonymization before the card purge, so it persists.

Object deletes (replaced or removed photos, a deleted card, account deletion, the 30-day purge) are queued in `photo_cleanup` in the same transaction, so a crash or a storage failure cannot orphan a file for good ([§3](#3-data-model)).

### Key layout

```
cards/{userId}/{cardId}/{slot}-{sha256}-{uploadId}.{webp|jpg}
cards/{userId}/{cardId}/{slot}-{sha256}-{uploadId}-thumb.{webp|jpg}
```

The hash in the key means a replaced photo gets a new key, so a cached copy can never be stale: the client asks for `?v={sha256}`, and a changed photo is a different URL. The `cards/{userId}/` prefix is what lets account deletion remove everything with one prefix sweep.

### Deletes after the commit

Photo deletes are queued with the database change and attempted **after** the commit (`AfterCommit`), so a rolled-back transaction never loses a photo. `FilesystemPhotoStore.deletePrefix` removes every file under the prefix, which is how account deletion clears `cards/{userId}/`.

### Storage setup

Set `PHOTO_DIR` to `/data/photos-private` in Dokploy for each environment (see [§13](#13-config-and-env-vars)); the `photo-folders` service creates `cards/` inside it. The old R2 photo buckets are retired ([INFRASTRUCTURE.md](INFRASTRUCTURE.md#r2-buckets)).

---

## 6. Offline

Cards have to work in a shop with no signal, so the whole wallet is offline-first. It builds on the offline machinery described in [`PWA.md`](PWA.md).

| Piece                 | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Where                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Persisted query cache | The `digitalCards` query keys are saved to IndexedDB (metadata only, never image bytes), so the list opens with no network. The keys are versioned (`["digitalCards", "v2", "me"]` and `["digitalCards", "v2", "config"]`) and `shouldPersistQuery` refuses any other `digitalCards` shape, so an older build's snapshot ages out instead of crashing the new reader. `CACHE_BUSTER` is unchanged. The snapshot never expires (`maxAge: Infinity`) and the card keys never leave memory (`gcTime: Infinity`), so a wallet last opened months ago still opens       | `lib/offline/cached-query-keys.ts`, `persister.ts`                          |
| Precached wallet page | Each build precaches `/digital-cards` in every language; offline any wallet URL falls back to it. The page holds no card data, so one copy serves every account. Details in [`PWA.md`](PWA.md) under "The wallet shell"                                                                                                                                                                                                                                                                                                                                            | `next.config.ts`, `lib/pwa/precached-pages.ts`, `app/sw.ts`                 |
| Unverified account    | Offline the session lookup fails, which is not a sign-out. `hasUnverifiedAccount` in the user context is true while this device's offline cache still names an account, and the wallet and the card modals read `canShowAccountData` (signed in or unverified), so they show the saved cards instead of a login prompt. The shopping lists and the watchlist follow the same flag ([PWA.md](PWA.md#5b-persisted-react-query-cache-indexeddb-works-everywhere)). Once the lookup succeeds, a different or missing account purges the cache as usual                 | `context/user-context.tsx`, `hooks/use-wallet-cards.ts`, `modal-router.tsx` |
| Paused mutations      | `digitalCardSave`, `digitalCardDelete`, `digitalCardPin`, `digitalCardArchive` are on the offline allowlist; offline they pause and are stored, then replay on reconnect. All share the mutation scope `{ id: "digitalCards" }`, so they replay one at a time in the order they were made                                                                                                                                                                                                                                                                          | `offline-mutation-keys.ts`, `offline-mutations.ts`                          |
| Client UUIDs          | The card id is made in the browser, so create and later edits replay in order                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `forms/digital-card-modal.tsx`                                              |
| Optimistic patches    | The cached list is patched at once, so the UI never waits                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `lib/api/digital-cards/optimistic-cards.ts`                                 |
| Photo blob store      | Downloaded photo bytes live in IndexedDB (`disscount-card-photos`), keyed `{identity}:{cardId}:{slot}:{size}:{sha256}`, fetched through the backend proxy on a miss                                                                                                                                                                                                                                                                                                                                                                                                | `lib/offline/card-photo-store.ts`, `hooks/use-card-photo.ts`                |
| Photo outbox          | A photo chosen offline, or a photo removal made offline, is saved in IndexedDB (`disscount-card-photo-outbox`), one entry per slot (a newer intent replaces an older one), and the slot shows "Čeka slanje". Each entry carries a nonce, so a finished send never deletes a newer entry. An entry not sent within seven days is dropped with its toast, as every offline write queue is (see [PWA.md](PWA.md#6-offline-writes-queue-and-replay))                                                                                                                   | `lib/offline/card-photo-outbox.ts`                                          |
| Last-used queue       | Opening a card writes a time into IndexedDB (`disscount-card-used`); it is flushed to `POST /used` at most once a minute and when the tab is hidden. A flush deletes only entries whose `usedAt` is unchanged, so a card opened again mid-request stays queued. The hidden-tab flush is a `keepalive` fetch carrying the backend proxy headers (`backendProxyHeaders()`) and the session cookie. It is not a paused mutation, because a lost write only costs a sort position                                                                                      | `lib/api/digital-cards/last-used.ts`                                        |
| Persistent storage    | `navigator.storage.persist()` is requested once, after the first saved card, so the browser does not evict cards and photos under storage pressure                                                                                                                                                                                                                                                                                                                                                                                                                 | `lib/offline/request-persistent-storage.ts`                                 |
| Purge on logout       | Any identity change clears user-specific queries, the persisted snapshot, the photo blobs, the photo outbox, the last-used queue (`deleteUsedQueueForIdentity`) and the scoped service-worker caches. `purge-gate.ts` registers a purge synchronously, and the persister, photo writes, outbox enqueues and last-used writes wait for it, so a fast re-login is not wiped by the previous account's purge. It also counts purges: each writer captures the count before its async work and drops the write if a purge started since, even one for the same account | `lib/offline/purge.ts`, `purge-gate.ts`                                     |

**Replay order matters.** On reconnect the provider first resumes the paused card saves and only then replays the photo outbox. An upload for a card the server has not seen yet would answer 404 and be dropped. A replay requested while one is running triggers another run afterwards, and the outbox re-reads each entry before sending it.

**Which failures keep or drop** is decided in one place, `lib/offline/failure-policy.ts` (`failureAction`). A network failure, 401, 408, 429, any 5xx and any status not listed below **keep** the entry: it stays queued and the replay stops, so the next run retries in order. 400, 404, 409, 413, 422 and a 503 with code `error.cardPhoto.unavailable` (photo storage is off on that deployment) **drop** it, because resending can never succeed. A dropped photo shows a toast, except for a 404 (the card is already gone). Direct photo uploads and removals made while online use the same rule: on keep (or a 404 for an upload) they go to the outbox. An upload the server refused but kept (a 429 rate limit, a 5xx) also shows the server's message as a toast, because the form has already closed on "saved"; only a network failure and a 404 wait quietly. A 404 when replaying a queued removal counts as done. Rollback of an optimistic card patch is per card, so a failure never undoes other cards. Card mutations (save, delete, pin, archive) also use this rule for retries (`lib/offline/card-retry.ts`), with backoff from 1 s capped at 30 s. A write started from the page retries a network failure for as long as the page is open, but a keep status from the server (401, 403, 429, 5xx) only up to five attempts (`CARD_WRITE_RETRY`), about 15 s, and a 401 `session_changed` never, because a retry would carry the new account's pin; then it fails, the optimistic card rolls back, a toast shows, and for a save the form reopens with what was typed and the error. A write replayed from disk follows the same bound, then fails with a toast (`card-write-failed.ts`) and the refetch drops its optimistic patch. A card write still in flight is persisted too, not only a paused one, and stored as paused so the restore resumes it (TanStack resumes only paused mutations, and a restored pending one would block the whole card scope); a reload during a server outage no longer loses it. Only card writes do this, because each is a PUT or DELETE by a client-minted id and so safe to send twice; a list item add is a POST. A mutation that fails because the device is offline pauses and retries once it reconnects. Every photo choice, online or offline, is written to the outbox first, so a reload never loses it. Only the sends are serialized per slot (`lib/offline/slot-lock.ts`): each send re-reads the newest entry inside the lock, and a send that finishes after a newer choice was queued leaves the cache alone, so an older upload cannot undo a newer choice. While the card save is paused, photo removals are queued in the outbox together with uploads, so a reload does not lose them.

**Photo blobs are pruned** when a card is deleted and whenever the card list refetches: a blob whose `sha256` no longer matches the card's current photo is removed.

**Writes that fail on replay** show a toast (`card-write-failed.ts`), because the `onError` passed when the mutation was started is lost on a page reload. A 404 is silent (the card was deleted elsewhere), and a 409 toasts only for the card-limit message.

---

## 7. Scanner hardening

Card numbers are long and a misread is worse than no read, so the shared scanner (`components/scanner/`, `context/scanner-context.tsx`) has a stricter mode for cards. Cards call `openScanner({ preset: "all", confirm: true, onScan })`. Products keep `preset: "product"` with no confirm step. The shared scanner itself (callers, camera picking, photo scanning) is in [SCANNER.md](SCANNER.md).

- **Consensus.** A code counts only after 3 identical reads within 1.5 seconds, or 4 for the weaker formats (`code_39`, `code_93`, `codabar`, `itf`). Products need 2. Logic: `scan-consensus.ts`, wired by `hooks/use-scan-consensus.ts`.
- **Check digits.** `utils/barcode/check-digits.ts` validates EAN-13, EAN-8, UPC-A, UPC-E (expanded) and ITF-14. A read that fails its check digit is dropped. After 5 seconds of nothing but rejects, a hint offers manual entry.
- **Normalization.** `utils/barcode/normalize-code.ts` turns UPC-A into `ean_13` with a leading 0, and a six- or seven-digit UPC-E into its eight-digit form (`upc-e.ts`), so the same card does not get two spellings. The renderer applies the same UPC-E step, so values saved before this rule still draw. Product scans keep the scanned value.
- **Confirm step.** In the same dialog the user sees the drawn barcode, the value in monospace and the format name, with "Koristi kod", "Skeniraj ponovno" and "Upiši ručno". When two different codes were seen within 800 ms, a radio list lets the user pick.
- **Feedback.** One vibration and one short beep (Web Audio, `scan-beep.ts`) per stable code, and a polite live region announces it. A still-image scan returns every code found, so the confirm step can offer them all.

---

## 8. Barcode rendering

`utils/card-code/generate-code-svg.ts` draws the code with `@bwip-js/browser`.

- It imports only the encoders it needs (EAN, UPC, Code 128, 39, 93, Codabar, ITF, QR, Aztec, Data Matrix, PDF417), not the whole library, to keep the bundle small.
- It is synchronous and returns `{ ok: true, svg }` or `{ ok: false }`. On `ok: false` the view falls back to the number in large text.
- The SVG uses `shape-rendering="crispEdges"`, keeps the quiet zone, and is always black on white. A white `rect` sits behind the bars so the quiet zone stays white on a dark page.
- Digit-only symbologies check the exact length first (`accepts`), because bwip would otherwise append a check digit and the drawn code would no longer match the stored number.
- Module widths are sized to the container's device pixels (`use-device-pixel-width.ts`) so scanners see whole pixels per bar.
- 2D codes (QR, Aztec, Data Matrix) are sized by `fit-code-size.ts` so they fit the tile in both directions with a whole number of device pixels per module.

**"Ne skenira se? Probaj drugi tip."** `code-alternatives.ts` lists other valid encodings of the same value (for digits: EAN-13 if the check digit holds, Code 128, Code 39, QR). The switcher previews them without touching the saved card; "Spremi kao zadano" saves the choice.

---

## 9. Colour palette

`utils/card-palette.ts` holds 19 colours taken from Google Calendar, shown as a hexagon in the form: Grafit in the centre, six lighter colours in the inner ring, twelve in the outer ring, ordered like a rainbow wheel with red at the top. Three near-twins were left out so no two cells look alike, and Ametist is darkened so it passes the contrast rule. Each entry carries an `id` (`graphite`, `amethyst`); its display name and hue live in the catalogs under `digitalCards.colors.<id>`.

- **Text colour** on a card is white or `#111827`, whichever has the higher WCAG contrast (`utils/color-contrast.ts`).
- **A contrast test** (`card-palette.test.ts`) fails CI if any palette colour is below 4.5:1 against its text colour. Add a colour and the test tells you if it is readable.
- **Screen readers** hear the name plus the hue, for example "Borovnica, tamnoplava", because a name alone says nothing.
- **Keyboard.** The hexagon is one radiogroup with one Tab stop; arrow keys move in 2D (`hex-grid.ts`, tested) and select. The hover scale only applies under `motion-safe`.
- **Chains.** `chain-default-colors.ts` maps an official chain to the closest palette colour. It applies only until the user picks a colour.
- There is no custom colour picker yet.

---

## 10. Privacy

A loyalty card number is personal data, and a photo of a card more so.

| Rule                                       | How it is enforced                                                                                                                                                                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card numbers never reach `localStorage`    | The form draft excludes `codeValue` and `barcodeValue` (`exclude` in `use-digital-card-form.ts`)                                                                                                                                    |
| Card numbers never reach URLs or search    | Search reads name, store and note only (`filterCards`); the modal URL carries a card id, never a number                                                                                                                             |
| A failed save can still restore the number | `pending-card-stash.ts` keeps the number in memory for 5 minutes so the reopened form is not empty. Memory only, gone on reload                                                                                                     |
| Account deletion purges cards              | `UserService.deleteAccount` locks the user, then calls `digitalCardService.deleteAllForUser`, which hard-deletes the user's cards and photo rows and queues removal of the `cards/{userId}/` prefix on disk                         |
| Deleted cards do not linger                | A delete is soft first; the daily `DigitalCardCleanupJob` (03:30 UTC) hard-deletes cards soft-deleted more than 30 days ago                                                                                                         |
| Photos are removed immediately on delete   | The photo rows and files go at once, even though the card row stays for the 30 days                                                                                                                                                 |
| Photo metadata is stripped                 | EXIF, XMP and ICC are removed server side, so a location in a photo never lands on disk                                                                                                                                             |
| The photo URL is private                   | `Cache-Control: no-store, private`, authenticated, and the owner is checked on every request. The app also fetches photos with cache mode `no-store`, so the browser HTTP cache, keyed by URL rather than account, never holds them |
| Logout wipes the device                    | `purgeOfflineCache` removes the cached list, photo blobs, the photo outbox and the last-used queue of that account                                                                                                                  |
| The store-name list is anonymous           | No user reference in `store_name_suggestion`; the private `store_name_usage` is never exposed and is deleted with the account; a name is shown only after two people use it                                                         |
| Photos stay on our server                  | The server is in Helsinki, in the EU                                                                                                                                                                                                |

---

## 11. Screens

- **`/digital-cards`.** Search (name, store, note), a sort select (Nedavno korišteno by default, then Naziv, Trgovina, Tip, Nedavno uređeno, Nedavno dodano, Boja; the choice is kept in `localStorage`), pinned cards first, a divider, the rest, and the archived cards. When both active and archived cards exist, they sit on two tabs, "Kartice" and "Arhivirane" (with the archived count), in a bar that sticks under the header; the open tab is kept in the URL hash (`#cards`, `#archived`). Two columns on mobile, three on desktop, tiles at a 1.5:1 ratio. If the user has exactly one active card it opens straight away, only on the first loaded render, so saving a first card from this page does not bounce into it (`use-auto-open-single-card.ts`). Changes such as a pin or a save are announced through a live region (`card-announcer.tsx`).
- **Tile.** The card colour, a round icon (photo icon, chain logo, initials or a generic icon), store name, card name, a date, and a pin button (labelled "Prikvači karticu <name>", with `aria-pressed`) that never triggers the tile. On desktop hover the tile flips to show the code, except under reduced motion.
- **Tile style (matte card).** `utils/card-tile-style.ts` sets per-tile variables: `--c` (card colour), `--ink` (from `textColorFor`), and `--away`, the far side from the ink (black under white text, white under dark text). Every decorative layer moves toward `--away`, so no pixel under text is worse than the plain card colour: a 155 degree fall-off of at most 12%, a hairline inset edge, and the initials (`utils/card-initials.ts`, two letters for a one-word store) debossed large in the corner at 11%. The page ring and shadow are theme tokens in `globals.css` (`--tile-outline`, `--tile-shadow`, `--tile-shadow-lift`), deeper in dark mode, and the card colour itself never changes with the theme. Text never uses opacity. An archived tile mixes 55% toward a neutral grey on the ink's far side, drops the shadow, and gets a dashed inset outline and an "Arhivirana" chip, so its text contrast rises instead of falling. The back face is literal white with a ring and a left stripe in the card colour. Forced-colors mode gets a `CanvasText` border, and the hover lift runs only for fine pointers with motion allowed. `utils/card-tile-contrast.test.ts` checks all 19 palette colours at 4.5:1 over the fall-off, the archived surface, the mark and the chip.
- **View modal** (`?modal=digital-card/view&id=`). A white panel with the code at full width, the number in large monospace text, a Screen Wake Lock while open (re-requested when the tab returns; a refusal is silent with a hint), a dismissible brightness hint, a rotate button for 1D codes, the "Ne skenira se?" switcher, a chain note for Lidl Plus, Kaufland, dm and a MultiPlus terms note, the photos, details, and the actions (uredi, prikvači, arhiviraj, obriši with a confirm).
- **Form modal** (`?modal=digital-card/new|edit`). Name, type, store (an Autocomplete with "Službene trgovine" and logos, "Ostalo" for community names, and free text), the code with a scanner button and a live preview, a toggle for a barcode payload that differs from the printed number, the colour hexagon, photos with camera capture, a note, and "Više detalja" for dates and balance.
- **Navigation.** Kartice is no longer a teaser. The bottom-nav long press opens a new card, the PWA shortcut list includes Kartice, and the landing page card links to `/digital-cards`.

---

## 12. Key files

| Path                                                                                           | Role                                                                                              |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `backend/.../digitalCard/service/CardPhotoWriter.java`, `CardUserLock.java`                    | The short row-write transaction; the per-user lock                                                |
| `backend/.../digitalCard/service/PhotoCleanupService.java`                                     | Queues file deletes in `photo_cleanup`, attempts them, retries                                    |
| `backend/.../digitalCard/service/DigitalCardCleanupJob.java`                                   | Daily 30-day hard delete; retries photo cleanup                                                   |
| `backend/.../config/UploadLimitConfig.java`                                                    | 20 card photo uploads per minute per user; the limiter sweeps its expired windows every 5 minutes |
| `frontend/src/lib/offline/card-photo-store.ts`, `card-photo-outbox.ts`, `purge.ts`             | Photo blobs, upload outbox, logout purge                                                          |
| `frontend/src/lib/offline/failure-policy.ts`, `card-retry.ts`, `slot-lock.ts`, `purge-gate.ts` | Keep or drop rules and card retries; per-slot photo ordering; purge ordering gate                 |
| `frontend/src/utils/browser/card-image.ts`                                                     | Card photo sizes and qualities, on top of the shared `utils/browser/image.ts`                     |
| `frontend/src/components/reui/autocomplete.tsx`                                                | The store field's Autocomplete (reui, built on `@base-ui/react`)                                  |

---

## 13. Config and env vars

One backend variable, **optional, runtime** (never `NEXT_PUBLIC_`). Leaving it blank turns photos off.

| Var         | What it controls                                                                                   | Example                |
| ----------- | -------------------------------------------------------------------------------------------------- | ---------------------- |
| `PHOTO_DIR` | The folder on the server's disk holding `cards/` (and the product originals, `product-originals/`) | `/data/photos-private` |

It is read in `backend/src/main/resources/application.properties` as `photos.private-dir`, and listed in `backend/.env.example`. Set it in **Dokploy, service, Environment**, per environment; a change needs a restart of the backend, not a rebuild.

Other settings that matter: `spring.servlet.multipart.max-file-size=512KB` and `max-request-size=1100KB` in `application.properties`. The test profile (`backend/src/test/resources/application.properties`) leaves `PHOTO_DIR` blank, so tests touch no photo folder.

---

## 14. Libraries

Versions are in `frontend/package.json` and `backend/pom.xml`. The ones whose role is not obvious from the name:

- `@bwip-js/browser`: draws barcodes and QR codes as SVG, in the browser, with no server round trip.
- `@base-ui/react`: the headless Autocomplete primitive behind the store field, via the reui registry component.
- `idb-keyval`: IndexedDB stores for photo blobs, the photo outbox and the last-used queue.

The store field's Autocomplete came from the reui registry (`@reui` in `frontend/components.json`) into `components/reui/autocomplete.tsx`. `components/ui/scroll-area.tsx` was added the same way.

---

## 15. What is automatic vs manual

| Thing                                                | Auto or manual | How                                                                     |
| ---------------------------------------------------- | -------------- | ----------------------------------------------------------------------- |
| Creating the new tables                              | Auto           | Hibernate `ddl-auto=update` on deploy (additive only)                   |
| Replaying offline writes                             | Auto           | `resumePausedMutations` on reconnect and on cache restore               |
| Replaying queued photos                              | Auto           | After the card saves, via `replayCardPhotoOutbox`                       |
| Sending last-used times                              | Auto           | At most once a minute, and when the tab hides                           |
| Retrying failed photo deletes                        | Auto           | `DigitalCardCleanupJob.retryPhotoCleanup`, every 15 minutes             |
| Purging data on logout                               | Auto           | `purgeOfflineCache` on any identity change                              |
| Hard-deleting cards soft-deleted 30 days ago         | Auto           | `DigitalCardCleanupJob`, daily at 03:30 UTC                             |
| Removing a user's cards and photos on account delete | Auto           | `UserService.deleteAccount`                                             |
| Shortcut icons for the PWA                           | Auto           | `scripts/generate-shortcut-icons.mjs` (the icon files are committed)    |
| **Setting `PHOTO_DIR`**                              | Manual         | Dokploy, per environment; the compose files forward it to the backend   |
| **Dropping the old `digital_card` table**            | Manual         | After deploy, once nothing reads it                                     |
| **Moderating community store names**                 | Manual         | No admin screen yet; set `hidden = true` in the database by hand        |
| **Till test with real cards**                        | Manual         | Lidl Plus QR, and the code types Konzum, Spar, Tommy and Studenac print |

---

## 17. Gotchas & lessons learned

| Gotcha                                      | What happens / fix                                                                                                                                                                                                                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The old `digital_card` table stays**      | `ddl-auto=update` never drops anything, and the rebuild uses new table names (`wallet_card`) so the stale table cannot merge into the new shape. It sits unused until you drop it by hand, after deploy, once nothing reads it. This is a one-way step, so check a backup exists first |
| **`ddl-auto=update` and enum columns**      | `card_type` and `code_type` are Strings, not Java enums, so adding a type later is an allowlist change, not a stale `CHECK` constraint that 500s on write                                                                                                                              |
| **Safari returns PNG for a WebP request**   | `canvas.toBlob("image/webp")` silently gives PNG on Safari, and the server rejects PNG. `encodeWebpOrJpeg` in `utils/browser/image.ts` checks `blob.type` and falls back to JPEG. Never remove that check                                                                              |
| **bwip-js is large**                        | Import only the named encoders from `@bwip-js/browser` (as `generate-code-svg.ts` does) rather than pulling in every symbology, or the bundle carries code for barcode types no card uses. This is a size concern I did not measure here                                               |
| **Photos are not a paused mutation**        | Bytes in a persisted mutation would bloat the single cache blob, so photos use their own outbox. Keep new photo work out of the mutation cache                                                                                                                                         |
| **Replay order**                            | Card saves must replay before photo uploads, or the upload 404s and is dropped                                                                                                                                                                                                         |
| **Bump the query key version with the DTO** | `DIGITAL_CARD_KEY_VERSION` in `lib/api/digital-cards/keys.ts` retires cached card data when its shape changes. Bump it instead of the persister `buster`                                                                                                                               |
| **No photo write inside a transaction**     | A photo is written to disk first and the row written after, in a short transaction. Holding a transaction open across the upload would pin a database connection on a slow disk                                                                                                        |
| **Last-used is not a mutation**             | Opening a card must never wait on the network. A lost write only changes sort order                                                                                                                                                                                                    |
| **The persister `buster`**                  | Bumping it discards every queued offline write for every user (see [`PWA.md`](PWA.md)). The cards rebuild did not change it; do not bump it for a small field change                                                                                                                   |
| **Store names must not fail a card save**   | `record` runs in `REQUIRES_NEW` and its failure is logged, not thrown                                                                                                                                                                                                                  |
| **`navigator.vibrate` moved**               | The scanner context no longer vibrates on every scan; `scanner-content.tsx` does it once per stable code. Do not add it back to the context                                                                                                                                            |
| **Gift card PINs are never stored**         | A PIN is a credential. If a future feature asks for one, treat it as a separate security design, not another text field                                                                                                                                                                |
| **Draft keys**                              | The form drafts live under `digital-card.new` and `digital-card.edit.<id>` and never hold a card number                                                                                                                                                                                |

---

## 18. Future improvements & TODOs

**Release 2 (planned next)**

- [ ] **Catima zip import and export**, so people can move cards in and out of Catima, the wallet app many of them use today.
- [ ] **Shopping-list card prompt**: when a list is for a store where the user has a card, prompt to open it.
- [ ] **"Imaš karticu" badge** on store chains the user has a card for.

**Later**

- [ ] **Guest mode**: let a visitor keep a few cards without an account and import them on login. The wallet is login-only for now.
