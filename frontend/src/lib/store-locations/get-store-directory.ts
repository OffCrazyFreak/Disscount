import "server-only";

import { after } from "next/server";

import { StoreDirectoryResponse } from "@/lib/api/schemas";
import { buildDirectory } from "@/lib/store-locations/build-directory";
import { readStoreLocations } from "@/lib/store-locations/location-repository";
import { runStoreLocationSync } from "@/lib/store-locations/sync/run-sync";
import { isSyncDue } from "@/lib/store-locations/sync/sync-lease";
import { fetchUpstreamStores } from "@/lib/store-locations/upstream-stores";

// Per process. Short enough that newly placed stores show up the same hour,
// long enough that upstream sees one request per instance, not one per visit.
const MEMO_MS = 10 * 60 * 1000;

// A run is mostly paced geocoder calls; anything past this is stuck.
const SYNC_TIMEOUT_MS = 45 * 60 * 1000;

let memo: { value: StoreDirectoryResponse; at: number } | null = null;
let pending: Promise<StoreDirectoryResponse> | null = null;
let syncRunning = false;

/** Every store with the best coordinates we have, for the map and its list. */
export async function getStoreDirectory(): Promise<StoreDirectoryResponse> {
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.value;

  // A burst of visits on a cold memo shares one upstream fetch.
  pending ??= buildStoreDirectory().finally(() => {
    pending = null;
  });

  const value = await pending;
  after(startSyncIfDue);

  return value;
}

async function buildStoreDirectory(): Promise<StoreDirectoryResponse> {
  const [upstream, locations] = await Promise.all([
    fetchUpstreamStores(),
    readStoreLocations(),
  ]);

  const value = {
    stores: buildDirectory(upstream, locations),
    generatedAt: new Date().toISOString(),
  };

  memo = { value, at: Date.now() };

  return value;
}

/**
 * Runs the location sync after the response is sent, so no visitor waits for
 * it. There is no cron: the first request of the day starts it, and the lease
 * keeps a second instance from running it twice.
 */
async function startSyncIfDue(): Promise<void> {
  if (syncRunning || !(await isSyncDue())) return;

  syncRunning = true;

  try {
    await runStoreLocationSync(AbortSignal.timeout(SYNC_TIMEOUT_MS));
    memo = null;
  } finally {
    syncRunning = false;
  }
}
