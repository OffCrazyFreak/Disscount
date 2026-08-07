import type { Query, QueryClient } from "@tanstack/react-query";

import { removePersistedCacheFor } from "@/lib/offline/persister";

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
export async function purgeOfflineCache(
  queryClient: QueryClient,
  identity: string,
) {
  // Cancel in-flight work first so a late-resolving request can't repopulate what we clear.
  await queryClient.cancelQueries({ predicate: isUserSpecific });

  queryClient.removeQueries({ predicate: isUserSpecific });
  queryClient.getMutationCache().clear();

  try {
    // Wipe the snapshot so no authed data lingers; public data re-persists on next save.
    await removePersistedCacheFor(identity);
    await purgeServiceWorkerCaches();
  } catch (error) {
    // Never let a failed IndexedDB purge block logout / auth-loss handling.
    console.error("Failed to clear the persisted offline cache", error);
  }
}
