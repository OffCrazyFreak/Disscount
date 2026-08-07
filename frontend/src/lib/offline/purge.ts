import type { Query, QueryClient } from "@tanstack/react-query";

import { removePersistedCacheFor } from "@/lib/offline/persister";

// Public data is identical logged in or out, so it survives logout.
const PUBLIC_QUERY_ROOT = "cijene";

// Service worker buckets that can hold data belonging to whoever was just here.
// "shared-list-pages" holds the server-rendered /s/ documents, which carry someone
// else's list title. "cijene-api" keeps one entry per product looked at, so the set of
// cached EANs is a list's contents even though each product is public on its own.
// "others" is where serwist's defaultCache actually puts navigations: its "pages" rule
// matches on a request Content-Type header that browsers do not send on a navigation,
// so every authenticated document falls through to it.
const SCOPED_CACHE_NAMES = ["shared-list-pages", "cijene-api", "others"];

// Everything outside the public root is user-specific and gets purged.
function isUserSpecific(query: Query): boolean {
  return query.queryKey[0] !== PUBLIC_QUERY_ROOT;
}

/**
 * Cache Storage is not identity-scoped and nothing else in the app ever deletes from it,
 * so without this a shared list's documents and product lookups outlive the session that
 * fetched them.
 */
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
