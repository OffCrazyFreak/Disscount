import type { Query, QueryClient } from "@tanstack/react-query";

import { deleteUsedQueueForIdentity } from "@/lib/api/digital-cards/last-used";
import { trackPurge } from "@/lib/offline/purge-gate";
import { deleteForIdentity } from "@/lib/offline/card-photo-store";
import { deleteOutboxForIdentity } from "@/lib/offline/card-photo-outbox";
import { removePersistedCacheFor } from "@/lib/offline/persister";
import { removeFormDraftsFor } from "@/utils/browser/storage/drafts";
import { setWatchlistPriceSnapshot } from "@/utils/browser/storage/watchlist";

// Public data is identical logged in or out, so it survives logout.
const PUBLIC_QUERY_ROOT = "cijene";

// Each leaks by its key set; "others" is where serwist puts navigations, since its "pages" rule matches a Content-Type header browsers omit.
const SCOPED_CACHE_NAMES = ["shopping-list-pages", "cijene-api", "others"];

function isUserSpecific(query: Query): boolean {
  return query.queryKey[0] !== PUBLIC_QUERY_ROOT;
}

/** Cache Storage is not identity-scoped and nothing else here ever deletes from it. */
async function purgeServiceWorkerCaches() {
  if (typeof caches === "undefined") return;

  const names = await caches.keys();

  await Promise.all(
    names
      // Exact match, because a substring test on "pages" would also take out serwist's "pages-rsc" and every RSC payload.
      .filter((name) => SCOPED_CACHE_NAMES.includes(name))
      .map((name) => caches.delete(name)),
  );
}

/** @param identity Named, not resolved, because the caller switches identity once this fires and the later delete would clear the wrong account. */
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
  // Cancel in-flight work first so a late-resolving request can't repopulate what we clear.
  await queryClient.cancelQueries({ predicate: isUserSpecific });

  // A removed query still on screen is never refetched, so reset clears its data and refetches with the new pin.
  void queryClient.resetQueries({
    predicate: (query) => isUserSpecific(query) && query.isActive(),
  });
  queryClient.removeQueries({
    predicate: (query) => isUserSpecific(query) && !query.isActive(),
  });
  queryClient.getMutationCache().clear();

  // allSettled so one failing delete cannot leave the departing account's data in the buckets it did not reach.
  const results = await Promise.allSettled([
    removePersistedCacheFor(identity),
    deleteForIdentity(identity),
    deleteOutboxForIdentity(identity),
    deleteUsedQueueForIdentity(identity),
    purgeServiceWorkerCaches(),
    // The baseline lists every watched EAN, the same leak the buckets above guard against.
    Promise.resolve().then(() => setWatchlistPriceSnapshot(identity, null)),
    Promise.resolve().then(() => removeFormDraftsFor(identity)),
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
