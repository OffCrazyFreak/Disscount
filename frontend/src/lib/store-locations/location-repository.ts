import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";
import { storeLocation } from "@/db/store-location-schema";
import { IResolvedLocation } from "@/lib/store-locations/types";

export type StoreLocationRow = typeof storeLocation.$inferSelect;

export async function readStoreLocations(): Promise<StoreLocationRow[]> {
  return db.select().from(storeLocation);
}

/** Saves a resolved location, unless a human already pinned the store. */
export async function saveResolvedLocation(
  store: { chain: string; code: string; address: string | null },
  location: IResolvedLocation,
): Promise<void> {
  const now = new Date();
  const fields = {
    ...location,
    address: store.address,
    lastAttemptAt: now,
    updatedAt: now,
  };

  await db
    .insert(storeLocation)
    .values({ chainCode: store.chain, storeCode: store.code, ...fields })
    .onConflictDoUpdate({
      target: [storeLocation.chainCode, storeLocation.storeCode],
      set: fields,
      setWhere: sql`${storeLocation.source} is distinct from 'manual'`,
    });
}

/** Records a source that could not place the store, so it is not retried soon. */
export async function recordFailedAttempt(
  chainCode: string,
  storeCode: string,
): Promise<void> {
  const now = new Date();

  await db
    .insert(storeLocation)
    .values({ chainCode, storeCode, attempts: 1, lastAttemptAt: now })
    .onConflictDoUpdate({
      target: [storeLocation.chainCode, storeLocation.storeCode],
      // Only unplaced stores and stale pins are targets, and a stale pin that
      // no source finds again must not keep pointing at the old building.
      set: {
        lat: null,
        lon: null,
        source: null,
        precision: null,
        attempts: sql`${storeLocation.attempts} + 1`,
        lastAttemptAt: now,
      },
      setWhere: sql`${storeLocation.source} is distinct from 'manual'`,
    });
}

/** Records a Geoapify miss, so its quota is not spent on the store again soon. */
export async function recordGeoapifyMiss(
  chainCode: string,
  storeCode: string,
): Promise<void> {
  const now = new Date();

  await db
    .insert(storeLocation)
    .values({ chainCode, storeCode, geoapifyMissedAt: now })
    .onConflictDoUpdate({
      target: [storeLocation.chainCode, storeLocation.storeCode],
      set: { geoapifyMissedAt: now },
      setWhere: sql`${storeLocation.lat} is null`,
    });
}
