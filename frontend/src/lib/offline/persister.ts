import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { defaultShouldDehydrateQuery } from "@tanstack/react-query";
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

// Bumping discards queued writes under every key, so prefer tombstones in offline-mutations.ts.
const CACHE_BUSTER = "3";

// Key resolved per call, so an identity change takes effect without rebuilding this.
const indexedDbStorage = {
  getItem: async (key: string) =>
    (await get<string>(scopedCacheKey(key))) ?? null,
  setItem: (key: string, value: string) => set(scopedCacheKey(key), value),
  removeItem: (key: string) => del(scopedCacheKey(key)),
};

// Tagged at dehydration because the throttle can hold it past a purge, when the key would name whoever signed in next.
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

/** Only paused mutations resume, and an unpaused pending one blocks later card writes in its scope. */
function withInFlightWritesPaused(client: PersistedClient): PersistedClient {
  const mutations = client.clientState.mutations.map((mutation) =>
    mutation.state.status === "pending" && !mutation.state.isPaused
      ? { ...mutation, state: { ...mutation.state, isPaused: true } }
      : mutation,
  );

  return { ...client, clientState: { ...client.clientState, mutations } };
}

const offlinePersister: Persister = {
  ...throttledPersister,
  persistClient: (client) => {
    const resumable = withInFlightWritesPaused(client);
    snapshotGeneration.set(resumable, currentPurgeGeneration());
    return throttledPersister.persistClient(resumable);
  },
};

/** `offlinePersister.removeClient()` resolves its key late, deleting the arriving account's cache. */
export function removePersistedCacheFor(identity: string): Promise<void> {
  return del(scopedCacheKey(IDB_CACHE_KEY, identity));
}

export const persistOptions: Omit<PersistQueryClientOptions, "queryClient"> = {
  persister: offlinePersister,
  // Never expires, so an old wallet still opens at the till; an identity change purges.
  maxAge: Infinity,
  buster: CACHE_BUSTER,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      defaultShouldDehydrateQuery(query) && shouldPersistQuery(query.queryKey),
    // Only allowlisted writes persist, so only they replay on reconnect.
    shouldDehydrateMutation: shouldPersistMutation,
  },
};
