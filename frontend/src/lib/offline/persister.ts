import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  defaultShouldDehydrateMutation,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import type { PersistQueryClientOptions } from "@tanstack/react-query-persist-client";
import { get, set, del } from "idb-keyval";

import { scopedCacheKey } from "@/lib/offline/cache-identity";
import { shouldPersistQuery } from "@/lib/offline/cached-query-keys";
import { shouldPersistMutation } from "@/lib/offline/offline-mutation-keys";

const IDB_CACHE_KEY = "disscount-react-query-cache";

// Bump on a breaking cache-shape change to discard stale persisted data.
// "2": ShoppingListDto dropped isPublic and gained linkAccess, shareToken and myAccess.
// A restored pre-change list has no myAccess, which every capability check would read
// as no access at all.
// "3": the entry is now keyed per identity, so the old shared blob is orphaned.
const CACHE_BUSTER = "3";

export const OFFLINE_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// IndexedDB over localStorage: larger, and safer for cached application data.
// The key is resolved per call rather than once, so an identity change takes effect on
// the next read or write without rebuilding the persister.
const indexedDbStorage = {
  getItem: async (key: string) =>
    (await get<string>(scopedCacheKey(key))) ?? null,
  setItem: (key: string, value: string) => set(scopedCacheKey(key), value),
  removeItem: (key: string) => del(scopedCacheKey(key)),
};

export const offlinePersister = createAsyncStoragePersister({
  storage: indexedDbStorage,
  key: IDB_CACHE_KEY,
});

export const persistOptions: Omit<PersistQueryClientOptions, "queryClient"> = {
  persister: offlinePersister,
  maxAge: OFFLINE_CACHE_MAX_AGE_MS,
  buster: CACHE_BUSTER,
  dehydrateOptions: {
    // Persist only successful queries that are on the offline whitelist.
    shouldDehydrateQuery: (query) =>
      defaultShouldDehydrateQuery(query) && shouldPersistQuery(query.queryKey),
    // Only allowlisted paused mutations persist, so only they replay on reconnect.
    shouldDehydrateMutation: (mutation) =>
      defaultShouldDehydrateMutation(mutation) &&
      shouldPersistMutation(mutation),
  },
};
