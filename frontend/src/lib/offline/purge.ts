import type { QueryClient } from "@tanstack/react-query";

import { offlinePersister } from "@/lib/offline/persister";

// Clears both the in-memory and persisted (IndexedDB) query caches. Call on
// logout so authed data never lingers on a shared device.
export async function purgeOfflineCache(queryClient: QueryClient) {
  queryClient.clear();

  try {
    await offlinePersister.removeClient();
  } catch (error) {
    // Never let a failed IndexedDB purge block logout / auth-loss handling.
    console.error("Failed to clear the persisted offline cache", error);
  }
}
