import type { Query, QueryClient } from "@tanstack/react-query";

import { offlinePersister } from "@/lib/offline/persister";

// Public data is identical logged in or out, so it survives logout.
const PUBLIC_QUERY_ROOT = "cijene";

// Everything outside the public root is user-specific and gets purged.
function isUserSpecific(query: Query): boolean {
  return query.queryKey[0] !== PUBLIC_QUERY_ROOT;
}

export async function purgeOfflineCache(queryClient: QueryClient) {
  // Cancel in-flight work first so a late-resolving request can't repopulate what we clear.
  await queryClient.cancelQueries({ predicate: isUserSpecific });

  queryClient.removeQueries({ predicate: isUserSpecific });
  queryClient.getMutationCache().clear();

  try {
    // Wipe the snapshot so no authed data lingers; public data re-persists on next save.
    await offlinePersister.removeClient();
  } catch (error) {
    // Never let a failed IndexedDB purge block logout / auth-loss handling.
    console.error("Failed to clear the persisted offline cache", error);
  }
}
