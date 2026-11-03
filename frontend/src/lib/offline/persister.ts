import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  defaultShouldDehydrateMutation,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import type {
  PersistedClient,
  Persister,
  PersistQueryClientOptions,
} from "@tanstack/react-query-persist-client";
import { get, set, del } from "idb-keyval";

import { scopedCacheKey } from "@/lib/offline/cache-identity";
import { shouldPersistQuery } from "@/lib/offline/cached-query-keys";
import {
  canWriteAfterPurges,
  currentPurgeGeneration,
} from "@/lib/offline/purge-gate";
import { shouldPersistMutation } from "@/lib/offline/offline-mutation-keys";

const IDB_CACHE_KEY = "disscount-react-query-cache";

// Bumping is heavier than it looks: a mismatch calls removeClient(), discarding queued
// writes under EVERY key, not just the changed one. Prefer tombstone defaults in
// offline-mutations.ts. History and reasoning in docs/PWA.md.
const CACHE_BUSTER = "3";

export const OFFLINE_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Key resolved per call, so an identity change takes effect without rebuilding this.
const indexedDbStorage = {
  getItem: async (key: string) =>
    (await get<string>(scopedCacheKey(key))) ?? null,
  setItem: (key: string, value: string) => set(scopedCacheKey(key), value),
  removeItem: (key: string) => del(scopedCacheKey(key)),
};

// Tagged when the snapshot is dehydrated: the throttle can hold it past a purge, and by
// the time it is written the key would name whoever signed in next.
const snapshotGeneration = new WeakMap<PersistedClient, number>();

async function serializeUnlessPurged(client: PersistedClient) {
  const captured = snapshotGeneration.get(client);
  // Throwing is how a save is skipped: the persister drops a failed save when no retry is set.
  if (captured === undefined || !(await canWriteAfterPurges(captured))) {
    throw new Error("Snapshot predates a purge of the offline cache");
  }

  return JSON.stringify(client);
}

const throttledPersister = createAsyncStoragePersister({
  storage: indexedDbStorage,
  key: IDB_CACHE_KEY,
  serialize: serializeUnlessPurged,
});

const offlinePersister: Persister = {
  ...throttledPersister,
  persistClient: (client) => {
    snapshotGeneration.set(client, currentPurgeGeneration());
    return throttledPersister.persistClient(client);
  },
};

/**
 * Deletes one identity's snapshot by name.
 *
 * `offlinePersister.removeClient()` resolves the key when it runs, which is the wrong
 * moment for a purge: the identity has already moved on by then, so it would delete the
 * arriving account's cache and leave the departing one's behind.
 */
export function removePersistedCacheFor(identity: string): Promise<void> {
  return del(scopedCacheKey(IDB_CACHE_KEY, identity));
}

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
