import type { QueryClient } from "@tanstack/react-query";

import { offlinePersister } from "./persister";

// Clears both the in-memory and persisted (IndexedDB) query caches. Call on
// logout so authed data never lingers on a shared device.
export async function purgeOfflineCache(queryClient: QueryClient) {
  queryClient.clear();
  await offlinePersister.removeClient();
}
