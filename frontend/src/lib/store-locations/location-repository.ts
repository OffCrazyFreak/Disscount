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
  chainCode: string,
  storeCode: string,
  location: IResolvedLocation,
): Promise<void> {
  const now = new Date();

  await db
    .insert(storeLocation)
    .values({
      chainCode,
      storeCode,
      ...location,
      lastAttemptAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [storeLocation.chainCode, storeLocation.storeCode],
      set: { ...location, lastAttemptAt: now, updatedAt: now },
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
      set: {
        attempts: sql`${storeLocation.attempts} + 1`,
        lastAttemptAt: now,
      },
      setWhere: sql`${storeLocation.lat} is null`,
    });
}
