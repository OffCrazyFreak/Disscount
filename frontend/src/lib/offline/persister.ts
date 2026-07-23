import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  defaultShouldDehydrateMutation,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import type { PersistQueryClientOptions } from "@tanstack/react-query-persist-client";
import { get, set, del } from "idb-keyval";

import { shouldPersistQuery } from "@/lib/offline/cached-query-keys";
import { shouldPersistMutation } from "@/lib/offline/offline-mutation-keys";

const IDB_CACHE_KEY = "disscount-react-query-cache";

// Bump on a breaking cache-shape change to discard stale persisted data.
const CACHE_BUSTER = "1";

export const OFFLINE_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// IndexedDB over localStorage: larger, and safer for cached application data.
const indexedDbStorage = {
  getItem: async (key: string) => (await get<string>(key)) ?? null,
  setItem: (key: string, value: string) => set(key, value),
  removeItem: (key: string) => del(key),
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
