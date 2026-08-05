import type { Query, QueryClient } from "@tanstack/react-query";

import { offlinePersister } from "@/lib/offline/persister";

// Public data is identical logged in or out, so it survives logout.
const PUBLIC_QUERY_ROOT = "cijene";

// Service worker buckets that can hold data belonging to whoever was just here. The
// pages bucket keeps server-rendered documents keyed by URL alone, and cijene-api keeps
// one entry per product looked at, so on a shared list the set of cached EANs is the
// list's contents even though each product is public on its own.
const SCOPED_CACHE_NAMES = ["pages", "cijene-api"];

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
      .filter((name) =>
        SCOPED_CACHE_NAMES.some((scoped) => name.includes(scoped)),
      )
      .map((name) => caches.delete(name)),
  );
}

export async function purgeOfflineCache(queryClient: QueryClient) {
  // Cancel in-flight work first so a late-resolving request can't repopulate what we clear.
  await queryClient.cancelQueries({ predicate: isUserSpecific });

  queryClient.removeQueries({ predicate: isUserSpecific });
  queryClient.getMutationCache().clear();

  try {
    // Wipe the snapshot so no authed data lingers; public data re-persists on next save.
    await offlinePersister.removeClient();
    await purgeServiceWorkerCaches();
  } catch (error) {
    // Never let a failed IndexedDB purge block logout / auth-loss handling.
    console.error("Failed to clear the persisted offline cache", error);
  }
}
