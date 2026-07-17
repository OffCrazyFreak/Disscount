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

// Bump when the cached data shape changes in a breaking way so stale persisted
// caches are discarded on the next load.
const CACHE_BUSTER = "1";

export const OFFLINE_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Async storage over IndexedDB (idb-keyval) — larger and safer than
// localStorage for cached application data.
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
    // Persist only paused (offline) mutations on the offline allowlist, so they
    // can be replayed on reconnect.
    shouldDehydrateMutation: (mutation) =>
      defaultShouldDehydrateMutation(mutation) &&
      shouldPersistMutation(mutation),
  },
};
