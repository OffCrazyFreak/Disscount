import type { Query, QueryClient } from "@tanstack/react-query";

import { deleteUsedQueueForIdentity } from "@/lib/api/digital-cards/last-used";
import { ANONYMOUS_IDENTITY } from "@/lib/offline/cache-identity";
import { forgetSubmittedProductSearch } from "@/components/custom/search/use-record-product-search";
import { trackPurge } from "@/lib/offline/purge-gate";
import { deleteForIdentity } from "@/lib/offline/card-photo-store";
import { deleteOutboxForIdentity } from "@/lib/offline/card-photo-outbox";
import { removePersistedCacheFor } from "@/lib/offline/persister";
import { removeFormDraftsFor } from "@/utils/browser/storage/drafts";
import { productRecentSearches } from "@/utils/browser/storage/recent-searches";
import { setWatchlistPriceSnapshot } from "@/utils/browser/storage/watchlist";

// Public data is identical logged in or out, so it survives logout.
const PUBLIC_QUERY_ROOT = "cijene";

// Buckets holding data belonging to whoever was just here. Each leaks by its key set
// rather than its payload: which lists this device opened, which EANs were looked at.
// "others" is where serwist actually puts navigations, since its "pages" rule matches a
// Content-Type header browsers omit on one.
const SCOPED_CACHE_NAMES = ["shopping-list-pages", "cijene-api", "others"];

// Everything outside the public root is user-specific and gets purged.
function isUserSpecific(query: Query): boolean {
  return query.queryKey[0] !== PUBLIC_QUERY_ROOT;
}

// Public data, but its keys say what this person searched for, opened and priced, and
// search suggestions read the names back.
function isProductLookup(query: Query): boolean {
  const [root, kind] = query.queryKey;
  return (
    root === PUBLIC_QUERY_ROOT &&
    (kind === "products" || kind === "product" || kind === "prices")
  );
}

/** A lookup still on screen stays until its page lets go, then goes like the rest. */
function removeOnceUnobserved(queryClient: QueryClient, lookups: Query[]) {
  if (!lookups.length) return;

  const cache = queryClient.getQueryCache();
  const waiting = new Set(lookups);
  const unsubscribe = cache.subscribe((event) => {
    if (event.type !== "observerRemoved" || !waiting.has(event.query)) return;
    if (event.query.isActive()) return;

    waiting.delete(event.query);
    cache.remove(event.query);
    if (!waiting.size) unsubscribe();
  });
}

/** Cache Storage is not identity-scoped and nothing else here ever deletes from it. */
async function purgeServiceWorkerCaches() {
  if (typeof caches === "undefined") return;

  const names = await caches.keys();

  await Promise.all(
    names
      // Exact match: a substring test on "pages" would also take out serwist's
      // "pages-rsc" and "pages-rsc-prefetch", every RSC payload in the app.
      .filter((name) => SCOPED_CACHE_NAMES.includes(name))
      .map((name) => caches.delete(name)),
  );
}

/**
 * @param identity whose snapshot to delete. Named rather than resolved from the current
 *   value, because the caller switches identity as soon as this is fired and the delete
 *   happens later, which would otherwise clear the wrong account.
 */
export function purgeOfflineCache(
  queryClient: QueryClient,
  identity: string,
): Promise<void> {
  const purge = runPurge(queryClient, identity);
  // Writes wait on it, so a fast re-login is not wiped by the purge of the previous run.
  trackPurge(purge);
  return purge;
}

async function runPurge(queryClient: QueryClient, identity: string) {
  // A guest signing in is still the same person, so what they searched stays.
  const wasSignedIn = identity !== ANONYMOUS_IDENTITY;

  // Cancel in-flight work first so a late-resolving request can't repopulate what we clear.
  await queryClient.cancelQueries({ predicate: isUserSpecific });

  // A removed query still on screen is never refetched, so it would stay failed or empty
  // as the new account. Resetting clears its data at once and refetches with the new pin.
  void queryClient.resetQueries({
    predicate: (query) => isUserSpecific(query) && query.isActive(),
  });
  queryClient.removeQueries({
    predicate: (query) =>
      (isUserSpecific(query) || (wasSignedIn && isProductLookup(query))) &&
      !query.isActive(),
  });
  if (wasSignedIn) {
    removeOnceUnobserved(
      queryClient,
      queryClient.getQueryCache().findAll({
        predicate: (query) => isProductLookup(query) && query.isActive(),
      }),
    );
  }
  queryClient.getMutationCache().clear();

  // Wipe the snapshot so no authed data lingers; public data re-persists on next save.
  // allSettled, not sequential awaits: one failing delete must not cancel the other and
  // leave the departing account's data in the buckets it did not reach.
  const results = await Promise.allSettled([
    removePersistedCacheFor(identity),
    deleteForIdentity(identity),
    deleteOutboxForIdentity(identity),
    deleteUsedQueueForIdentity(identity),
    purgeServiceWorkerCaches(),
    // The baseline lists every watched EAN, the same leak the buckets above guard against.
    Promise.resolve().then(() => setWatchlistPriceSnapshot(identity, null)),
    Promise.resolve().then(() => removeFormDraftsFor(identity)),
    Promise.resolve().then(() => {
      if (!wasSignedIn) return;
      productRecentSearches.clear();
      forgetSubmittedProductSearch();
    }),
  ]);

  // Never let a failed purge block logout / auth-loss handling.
  for (const result of results) {
    if (result.status === "rejected") {
      console.error(
        "Failed to clear the persisted offline cache",
        result.reason,
      );
    }
  }
}
