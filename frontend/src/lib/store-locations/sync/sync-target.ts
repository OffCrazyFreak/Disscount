import "server-only";

import { StoreResponse } from "@/lib/cijene-api/schemas";
import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { cleanUpstreamAddress } from "@/lib/store-locations/address-key";
import { StoreLocationRow } from "@/lib/store-locations/location-repository";
import { storeKey } from "@/lib/store-locations/upstream-stores";

/** A store the sync still has to place. */
export interface ISyncTarget {
  chain: string;
  code: string;
  address: string | null;
  city: string | null;
  zipcode: string | null;
}

const RETRY_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Stores upstream cannot place and we have not placed either, minus those that
 * every source failed on within the last week: addresses rarely change, so
 * retrying them daily would only spend geocoder quota.
 */
export function findSyncTargets(
  upstream: StoreResponse[],
  locations: StoreLocationRow[],
  now = Date.now(),
): ISyncTarget[] {
  const byKey = new Map(
    locations.map((row) => [storeKey(row.chainCode, row.storeCode), row]),
  );

  return upstream
    .filter((store) => !sanitizeCoordinates(store.lat, store.lon))
    .filter((store) => {
      const row = byKey.get(storeKey(store.chain_code, store.code));

      if (!row) return true;
      if (row.lat != null || row.source === "manual") return false;

      return (
        !row.lastAttemptAt || now - row.lastAttemptAt.getTime() > RETRY_AFTER_MS
      );
    })
    .map((store) => ({
      chain: store.chain_code,
      code: store.code,
      address: cleanUpstreamAddress(store.address),
      city: store.city,
      zipcode: store.zipcode,
    }));
}
