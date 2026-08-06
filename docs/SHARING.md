# Shopping list sharing

How a shopping list is shared with someone else: the access model, the capability token,
the public route, and the privacy decisions that fall out of all three.

## Contents

1. [What it is](#1-what-it-is)
2. [The access model](#2-the-access-model)
3. [The token, and why it is not the list id](#3-the-token-and-why-it-is-not-the-list-id)
4. [Backend](#4-backend)
5. [The public route](#5-the-public-route)
6. [Offline](#6-offline)
7. [Privacy decisions](#7-privacy-decisions)
8. [Key files](#8-key-files)
9. [Gotchas](#9-gotchas)
10. [Not built yet](#10-not-built-yet)

## 1. What it is

An owner turns on a link for one of their lists and picks what it grants. Anyone holding
the link can open it at `/s/<token>`, with no account. Signing in raises what they can do,
up to the level the link grants. The owner can change the level or revoke the link at any
time, from the share modal at `?modal=shopping-list/share`.

There are no named members and no invitations. The only way in is a link someone chose to
send you, which is what keeps the feature free of an accept queue, a notifications
surface, and a spam vector.

## 2. The access model

Two enums. `LinkAccess` is what an owner can set a link to, and `ListAccess` is what a
caller resolved to, which adds `OWNER`:

| Level   | Read | Tick off, pick a shop | Amount, remove | Rename | Manage sharing |
| ------- | ---- | --------------------- | -------------- | ------ | -------------- |
| `NONE`  | no   | no                    | no             | no     | no             |
| `VIEW`  | yes  | no                    | no             | no     | no             |
| `SHOP`  | yes  | yes                   | no             | no     | no             |
| `EDIT`  | yes  | yes                   | yes            | yes\*  | no             |
| `OWNER` | yes  | yes                   | yes            | yes    | yes            |

\* The backend allows an `EDIT` caller to rename, but no rename control is rendered for a
non-owner: `shopping-list-header.tsx` passes `showEditButton={isOwner}` and the prop
defaults to `false`, so neither the desktop nor the mobile action group offers it. The
shared page renders that same header, which is what gates it there too.

The modal's `EDIT` hint reads "Može uređivati cijeli popis, ali ne može dodavati nove
proizvode." It names the one limitation people actually trip over, item creation, and does
not enumerate renaming either way. Both renaming and adding are deferred to the membership
work, where per-person revocation makes unbounded additions safe to grant.

`OWNER` is never stored. It is what `ShoppingListAccessService.resolve` returns when the
caller owns the list, and the request DTO is bound to a separate `LinkAccess` enum that
cannot express it, so it is rejected at deserialization rather than by a service guard.

**Anonymous callers are capped at `VIEW`** however generous the link is. That is the rule
that keeps every write attributable to an account.

## 3. The token, and why it is not the list id

`shopping_list.share_token` is a random UUID, separate from the list's primary key.

Reusing the list id would have been simpler and is wrong: turning sharing off and back on
would hand out the same URL, so everyone who kept the old link would silently regain
access. With a separate token, disabling sharing nulls it and re-enabling mints a fresh
one, which makes off-then-on a real revoke. Changing the level alone deliberately keeps
the token, because the people already holding the link are meant to keep working.

The list's own id never appears in a shared URL.

122 bits of entropy from `UUID.randomUUID()` (SecureRandom-backed) is an adequate
capability token. There is no expiry and no rate limiting on `/api/shared/**` yet; both are
listed in [§10](#10-not-built-yet).

## 4. Backend

`/api/shared/**` has its own `@Order(1)` `SecurityFilterChain`. It is the only place where
a bearer token is **optional**, so it uses `OptionalBearerAuthenticationFilter` rather than
`oauth2ResourceServer`: the standard `BearerTokenAuthenticationFilter` answers 401 for an
expired or malformed token before authorization is consulted, which would lock a visitor
with a stale cached token out of a link that works. See `docs/AUTH.md` §7.

| Method | Path                             | Required access                                    |
| ------ | -------------------------------- | -------------------------------------------------- |
| GET    | `/api/shared/{token}`            | `VIEW`                                             |
| PUT    | `/api/shared/{token}`            | `EDIT` (title only)                                |
| PUT    | `/api/shared/{token}/items/{id}` | `SHOP` for the in-shop fields, `EDIT` for the rest |
| DELETE | `/api/shared/{token}/items/{id}` | `EDIT`                                             |

An unknown, malformed or revoked token is a **404, never a 403**, so the response cannot be
used to confirm that a list exists. `SharedShoppingListService.findShared` returns an empty
`Optional` for all three cases and the controller turns that into a 404.

`applyItemUpdate` splits the item fields by level: a `SHOP` caller can change `isChecked`,
`chainCode` and the captured prices, and everything structural is left as the server has
it, so a fuller payload cannot rename or resize an item.

## 5. The public route

`/s/[token]` is a real public route, outside the `(user)` group and not in
`PROTECTED_ROUTE_PREFIXES`. It renders the same section components as the owner's list
page, gated on the resolved access, so there is one set of components rather than two.

`generateMetadata` fetches the list server-side for the link preview title and item count,
with a 3 second timeout. The page sets `robots: { index: false }` and `next.config.ts`
sends `X-Robots-Tag: noindex, nofollow` plus `Referrer-Policy: no-referrer`.

The header is deliberately a **header, not a robots.txt disallow**: a disallowed URL is
never fetched, so the crawler would never read the directive. A shared link only leaks by
being pasted somewhere crawlable, which is exactly the case the header covers.

An owner opening their own link is redirected to `/shopping-lists/<id>`, where sharing,
editing and deleting live.

## 6. Offline

Shared lists work offline like your own: reads persist, writes queue and replay.

This costs more than it sounds, because a shared list is **someone else's data on your
device**. Making it safe required the offline cache to gain per-identity scoping, which it
had never had: one browser-wide IndexedDB blob served every account, and the only
mechanism was a destructive purge. See `docs/PWA.md` §5b for `cache-identity.ts`.

The `/s/` service worker rule is `NetworkFirst`, not `NetworkOnly`, so an offline reload
boots the app instead of the `/offline` fallback. That is only acceptable because the
purge now deletes the `shared-list-pages`, `cijene-api` and `others` buckets on a change of
identity. Those names are matched by exact equality, not by substring: a substring match on
`pages` would also take out `pages-rsc` and `pages-rsc-prefetch`, every RSC payload in the app.

## 7. Privacy decisions

Worth knowing before changing any of this:

- **Account ids are owner-only.** `ownerId` and each item's `updatedByUserId` are nulled
  for anyone else. They are stable cross-request identifiers, so a forwarded link would
  otherwise let a recipient correlate two links as belonging to one person.
- **`linkAccess` and `shareToken` are owner-only**, so a recipient cannot reshare a list at
  a level its owner never granted.
- **The token is scrubbed from telemetry.** It sits in the URL path, and Sentry attaches
  page URLs to events and records fetch breadcrumbs, neither of which `sendDefaultPii: false`
  covers. `lib/sentry/scrub-share-token.ts` rewrites it in `beforeSend` and
  `beforeSendTransaction` on both client and server, plus `beforeBreadcrumb` on the client.
  Replay is the exception: its envelopes never pass through `beforeSend`, so `/s/` pages are
  excluded from recording outright rather than scrubbed.
- **Proxy access logs still record the full path.** Not fixed in the app, because it is a
  Traefik log-format change on the Dokploy side. Worth doing.

## 8. Key files

| Area          | Path                                                                           |
| ------------- | ------------------------------------------------------------------------------ |
| Access rule   | `backend/.../shoppingList/service/ShoppingListAccessService.java`              |
| Levels        | `backend/.../shoppingList/domain/ListAccess.java`, `LinkAccess.java`           |
| Shared API    | `backend/.../shoppingList/rest/SharedShoppingListController.java`              |
| Shared logic  | `backend/.../shoppingList/service/SharedShoppingListService.java`              |
| Redaction     | `backend/.../shoppingList/service/ShoppingListMapper.java`                     |
| Optional auth | `backend/.../config/OptionalBearerAuthenticationFilter.java`                   |
| Public page   | `frontend/src/app/s/[token]/`                                                  |
| Share modal   | `frontend/src/app/(user)/shopping-lists/components/forms/share-list-modal.tsx` |
| Access row    | `frontend/src/app/(user)/shopping-lists/components/forms/share-access-row.tsx` |
| Modal state   | `frontend/src/app/(user)/shopping-lists/hooks/use-share-list-modal.ts`         |
| Level copy    | `frontend/src/app/(user)/shopping-lists/utils/link-access-copy.ts`             |
| Optimism      | `frontend/src/lib/api/shopping-lists/optimistic-list.ts`                       |
| Client access | `frontend/src/app/(user)/shopping-lists/utils/shopping-list-access.ts`         |
| Token scrub   | `frontend/src/lib/sentry/scrub-share-token.ts`                                 |

## 9. Gotchas

- **`ddl-auto=update` and the enum.** `link_access` is `@Enumerated(EnumType.STRING)`, so
  Hibernate generated a CHECK constraint for it and will never alter that constraint.
  Adding a fifth level later needs the constraint dropped by hand.
- **`link_access` must stay nullable.** `ddl-auto=update` cannot add a `NOT NULL` column to
  a populated table. Read it through `resolvedLinkAccess()`, which maps null to `NONE`,
  never directly.
- **Copying a shared list produces a private list**, by construction: `createShoppingList`
  reads no sharing field at all. The toast says so, because someone copying a shared list
  may reasonably assume the same people can still reach the copy.
- **The share modal saves on change**, with no submit button, because the server mints the
  token and there is no link to show until a save returns. That is why it needs a live
  region: there is no submit button whose disappearance would signal success, and why it
  renders no footer at all (omitting `cancelLabel` is what drops it, since
  `hasFooterContent` keys off labels rather than handlers).
- **Private is a level, not an off switch.** One select carries all four values, so turning
  sharing off is picking `Privatno` rather than flipping a control that then reveals a
  second one. The row beside it restates the current level in words, following the shape
  Google Drive uses.
- **The list mutation must write the cache, not just invalidate it.** `useUpdateShoppingList`
  patches `byId` and `me` in `onMutate` and writes the response in `onSuccess`
  (`optimistic-list.ts`). `invalidateQueries` only _starts_ a refetch, so when the modal
  mirrored the pending level in component state and cleared it on settle, the control fell
  back to the pre-save value for a whole round trip and visibly flickered new, old, new.
  The response is also the only place a freshly minted `shareToken` appears, so discarding
  it delayed the link by a second request.

## 10. Not built yet

- **Named members** (version 2): a `shopping_list_member` table, single-use invite links at
  `/p/<token>`, per-person revocation, and a "limit access to current members" freeze. The
  resolver is already the single place that would need the `max(member, link)` branch.
- **Adding items through a link.** `EDIT` covers amounts, removal, ticking, store choice
  and renaming, but not adding. Membership is the natural place for it.
- **Renaming from a shared link.** The endpoint exists; no UI reaches it.
- **Attribution in the UI.** `updated_by_user_id` is already stamped by shared writes, so
  version 2 starts with real history rather than an empty column. It will need a
  denormalised name, since account deletion nulls `username`.
- **Token rotation without revoking.** Today the only way to invalidate a leaked link while
  staying shared is to turn sharing off and on, which is two requests and loses access for
  everyone in between if the second fails.
- **An expiry, and rate limiting on `/api/shared/{token}`.** Recommended by the W3C TAG for
  capability URLs. Brute-forcing 122 bits is infeasible, so this is hygiene.
- **Invite by email or username** (version 3): blocked on `app_user.username` being
  nullable and non-unique, on email living in the better-auth tables, and on the
  notifications rework, since searching by identifier reintroduces the spam vector the
  link model avoids.
