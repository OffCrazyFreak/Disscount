# Shopping list sharing

How a shopping list is shared with someone else: the access model, the URL that
carries it, and the privacy decisions that fall out of both.

## Contents

1. [What it is](#1-what-it-is)
2. [The access model](#2-the-access-model)
3. [The id is the link, and what that costs](#3-the-id-is-the-link-and-what-that-costs)
4. [Backend](#4-backend)
5. [The route](#5-the-route)
6. [Offline](#6-offline)
7. [Privacy decisions](#7-privacy-decisions)
8. [Key files](#8-key-files)
9. [Gotchas](#9-gotchas)
10. [Not built yet](#10-not-built-yet)

## 1. What it is

An owner turns on a link for one of their lists and picks what it grants. Anyone holding
the link can open it at `/shopping-lists/<id>`, with no account. Signing in raises what they can do,
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
defaults to `false`, so the single action row (`shopping-list-action-row.tsx`) never
renders it at any width. The
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

## 3. The id is the link, and what that costs

A shopping list is shared at its own URL, `/shopping-lists/<id>`. There is no separate share token: `link_access` says what holding that URL grants, and the URL an owner sees in the address bar is the one worth sending.

This replaced a rotating capability token in August 2026. The token existed for revocation: turning sharing off nulled it, turning it back on minted a new one, so everyone holding the old link genuinely lost access. That is real, and it was given up on purpose. A grocery list is shared once, used for a week and abandoned, so the scenario rotation protects against does not arrive often enough to pay for. What it cost in exchange was that an owner copying their own URL handed out something that failed for everybody else, with nothing in the URL to explain why. Google Docs works the same way and cannot rotate a link at all.

Two consequences to hold on to:

**Off then on is not a revoke.** Re-enabling sharing hands back the same URL, so anyone who kept it is back in. The share modal's copy says so rather than implying a clean break.

**A shared list's id is a capability, and it is not scrubbed.** While `link_access` is set, holding the id is enough. That id also appears in ordinary places: Sentry events, the Traefik access log, browser history, React Query keys, IndexedDB. Unlike the token it replaced it cannot be redacted, because it is the application's identifier everywhere and scrubbing it would blind every shopping-list trace rather than protect one route. **This is an accepted trade, not an oversight.** It is bounded by the id being inert the moment the list is not shared, and by both leak surfaces being ours.

## 4. Backend

The by-id routes have their own `@Order(1)` `SecurityFilterChain`. They are the only place where a bearer token is **optional**, so it uses `OptionalBearerAuthenticationFilter` rather than `oauth2ResourceServer`: the standard `BearerTokenAuthenticationFilter` answers 401 for an expired or malformed token before authorization is consulted, which would lock a visitor with a stale cached token out of a link that works. See `docs/AUTH.md` §7.

| Method | Path                                      | Required access                                      |
| ------ | ----------------------------------------- | ---------------------------------------------------- |
| GET    | `/api/shopping-lists/{id}`                | `VIEW`                                               |
| PUT    | `/api/shopping-lists/{id}`                | `EDIT` for the title, `OWNER` to change `linkAccess` |
| DELETE | `/api/shopping-lists/{id}`                | `OWNER`                                              |
| POST   | `/api/shopping-lists/{id}/items`          | `OWNER`                                              |
| PUT    | `/api/shopping-lists/{id}/items/{itemId}` | `SHOP` for the in-shop fields, `EDIT` for the rest   |
| DELETE | `/api/shopping-lists/{id}/items/{itemId}` | `EDIT`                                               |

A list the caller may not see is a **404, never a 403**, so the response cannot be used to confirm that a list exists. The branch lives in `ShoppingListService.findVisible`, which is the only caller of `findActiveById` and runs before every other check. There is deliberately no `findActiveByIdAndOwner`: that was the old authorization mechanism, and a future method reaching for it would silently get owner-only semantics and the 400 that tells a stranger the id was real.

`applyItemUpdate` splits the item fields by level: a `SHOP` caller can change `isChecked`, `chainCode` and the captured prices, and everything structural is left as the server has it, so a fuller payload cannot rename or resize an item.

**Only these six routes take an optional bearer token.** `SecurityConfig` matches them by method plus a UUID-shaped id, which is an allowlist on both axes: `/api/shopping-lists/me` and `/api/shopping-lists/items` stay authenticated because they are not UUIDs, not because they are named as exceptions, and a future literal route is excluded by the same property. The chain's own rule is `permitAll`, so the checks in `ShoppingListService` are an authentication boundary rather than a convenience.

## 5. The route

`/shopping-lists/[id]` serves the owner and any link visitor from one page, gated on the access the server resolved into `myAccess`. There is no second route and no second set of components.

It is therefore reachable signed out, and nothing on it may assume ownership. `shopping-list-detail-client.tsx` reads the session rather than hardcoding it, and the access banner renders unconditionally: it falls silent for an owner on its own, and the disabled item controls point at its id with `aria-describedby`, so gating it would leave that IDREF dangling for exactly the people who need the explanation. It emits an empty element carrying the id when it has nothing to say, because a DTO persisted before `myAccess` existed replays with it undefined.

`next.config.ts` sends `X-Robots-Tag: noindex, nofollow` and `Referrer-Policy: no-referrer` on `/shopping-lists/:path*`. The header is deliberate rather than a `robots.txt` disallow: a disallowed URL is never fetched, so a crawler would never read the directive, and a shared link only leaks by being pasted somewhere crawlable. `app/robots.ts` therefore stops deriving its disallow list from `PROTECTED_ROUTE_PREFIXES`, which still carries `/shopping-lists` for the logout redirect.

## 6. Offline

Shared lists work offline like your own: reads persist, writes queue and replay.

This costs more than it sounds, because a shared list is **someone else's data on your
device**. Making it safe required the offline cache to gain per-identity scoping, which it
had never had: one browser-wide IndexedDB blob served every account, and the only
mechanism was a destructive purge. See `docs/PWA.md` §5b for `cache-identity.ts`.

The `/shopping-lists/` service worker rule is `NetworkFirst`, not `NetworkOnly`, so an offline reload
boots the app instead of the `/offline` fallback. That is only acceptable because the
purge now deletes the `shopping-list-pages`, `cijene-api` and `others` buckets on a change of
identity. Those names are matched by exact equality, not by substring: a substring match on
`pages` would also take out `pages-rsc` and `pages-rsc-prefetch`, every RSC payload in the app.

## 7. Privacy decisions

Worth knowing before changing any of this:

- **Account ids are owner-only.** `ownerId` and each item's `updatedByUserId` are nulled
  for anyone else. They are stable cross-request identifiers, so a forwarded link would
  otherwise let a recipient correlate two links as belonging to one person.
- **`linkAccess` is owner-only**, so a recipient cannot read or change the level its owner
  granted. The share and edit modals additionally refuse to render for a non-owner, since
  the by-id read they sit on now succeeds for link visitors too.
- **The list id is not scrubbed from telemetry, on purpose.** See [§3](#3-the-id-is-the-link-and-what-that-costs). Sentry attaches page URLs and records fetch breadcrumbs, so a shared list's id reaches it. Redacting the app's own identifier would blind every shopping-list trace, and the id is inert once the list is not shared.
- **Proxy access logs record the full path** for the same reason. A Traefik log-format
  change on the Dokploy side could drop it, and the same trade applies.

## 8. Key files

| Area          | Path                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------- |
| Access rule   | `backend/.../shoppingList/service/ShoppingListAccessService.java`                        |
| Levels        | `backend/.../shoppingList/domain/ListAccess.java`, `LinkAccess.java`                     |
| List API      | `backend/.../shoppingList/rest/ShoppingListController.java`                              |
| List logic    | `backend/.../shoppingList/service/ShoppingListService.java`                              |
| Redaction     | `backend/.../shoppingList/service/ShoppingListMapper.java`                               |
| Optional auth | `backend/.../config/OptionalBearerAuthenticationFilter.java`                             |
| Route matcher | `backend/.../config/UuidScopedRequestMatcher.java`                                       |
| List page     | `frontend/src/app/(user)/shopping-lists/[id]/`                                           |
| Access banner | `frontend/src/app/(user)/shopping-lists/[id]/components/shopping-list-access-banner.tsx` |
| Share modal   | `frontend/src/app/(user)/shopping-lists/components/forms/share-list-modal.tsx`           |
| Access row    | `frontend/src/app/(user)/shopping-lists/components/forms/share-access-row.tsx`           |
| Modal state   | `frontend/src/app/(user)/shopping-lists/hooks/use-share-list-modal.ts`                   |
| Level copy    | `frontend/src/app/(user)/shopping-lists/utils/link-access-copy.ts`                       |
| Level icons   | `frontend/src/app/(user)/shopping-lists/utils/link-access-icons.ts`                      |
| Copy modal    | `frontend/src/app/(user)/shopping-lists/components/forms/copy-list-modal.tsx`            |
| Optimism      | `frontend/src/lib/api/shopping-lists/optimistic-list.ts`                                 |
| Client access | `frontend/src/app/(user)/shopping-lists/utils/shopping-list-access.ts`                   |

## 9. Gotchas

- **`ddl-auto=update` and the enum.** `link_access` is `@Enumerated(EnumType.STRING)`, so
  Hibernate generated a CHECK constraint for it and will never alter that constraint.
  Adding a fifth level later needs the constraint dropped by hand.
- **`link_access` must stay nullable.** `ddl-auto=update` cannot add a `NOT NULL` column to
  a populated table. Read it through `resolvedLinkAccess()`, which maps null to `NONE`,
  never directly.
- **Copying a list asks what to carry.** Products default on; the ticks with their captured
  prices, and the sharing settings, default off. The sharing option is owner-only, or a
  recipient could copy a shared list and hand the owner's people a link at a level the
  owner never chose. The server refuses `linkAccess` from a non-owner regardless.
- **The share modal saves on change**, with no submit button, because there is nothing to
  confirm once the URL is the list's own. That is why it needs a live
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

## 10. Not built yet

- **Named members** (version 2): a `shopping_list_member` table, invite links, per-person
  revocation, and a "limit access to current members" freeze. The resolver is already the
  single place that would need the `max(member, link)` branch. Invite by username is part
  of it now rather than a later version, since `app_user.username` became unique in the
  same release as this rework; email invites still wait on the notifications work.
- **Adding items through a link.** `EDIT` covers amounts, removal, ticking, store choice
  and renaming, but not adding. Membership is the natural place for it.
- **Renaming from a shared link.** The endpoint exists; no UI reaches it.
- **Attribution in the UI.** `updated_by_user_id` is already stamped by shared writes, so
  version 2 starts with real history rather than an empty column. It will need a
  denormalised name, since account deletion nulls `username`.
- **Rate limiting on the by-id routes.** Recommended by the W3C TAG for capability URLs.
  Brute-forcing a version 4 UUID is infeasible, so this is hygiene rather than a hole.
- **Link expiry.** There is none, and with rotation gone there is no way to invalidate a
  shared URL except making the list private, which affects everyone at once.
