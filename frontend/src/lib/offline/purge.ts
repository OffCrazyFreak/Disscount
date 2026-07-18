import type { QueryClient } from "@tanstack/react-query";

import { offlinePersister } from "@/lib/offline/persister";

// Public data (product prices, chains, stores) lives under the "cijene" query
// key and is the same whether or not you are logged in. Keeping it cached across
// logout/login avoids a slow refetch of pages the user was just looking at.
const PUBLIC_QUERY_ROOT = "cijene";

// Clears user-specific queries (and queued writes) from memory and disk on
// logout, but preserves the public "cijene" cache so non-user pages stay fast.
export async function purgeOfflineCache(queryClient: QueryClient) {
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== PUBLIC_QUERY_ROOT,
  });
  queryClient.getMutationCache().clear();

  try {
    // Wipe the persisted snapshot so no authed data lingers on disk; the
    // remaining public cache is re-persisted on the next throttled save.
    await offlinePersister.removeClient();
  } catch (error) {
    // Never let a failed IndexedDB purge block logout / auth-loss handling.
    console.error("Failed to clear the persisted offline cache", error);
  }
}
