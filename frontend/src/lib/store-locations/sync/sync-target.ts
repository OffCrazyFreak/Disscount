import "server-only";

import { StoreResponse } from "@/lib/cijene-api/schemas";
import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { cleanUpstreamAddress } from "@/lib/store-locations/address-key";
import { StoreLocationRow } from "@/lib/store-locations/location-repository";
import { PIN_OVERRIDES } from "@/lib/store-locations/pin-overrides";
import { storeKey } from "@/lib/store-locations/upstream-stores";

/** A store the sync still has to place. */
export interface ISyncTarget {
  chain: string;
  code: string;
  address: string | null;
  city: string | null;
  zipcode: string | null;
  /** Geoapify missed it within the retry window, so only Nominatim tries. */
  skipGeoapify: boolean;
}

const RETRY_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/** A pin saved before addresses were recorded is kept as it is. */
export function isStalePin(
  row: StoreLocationRow,
  upstreamAddress: string | null,
): boolean {
  return (
    row.source !== "manual" &&
    row.address != null &&
    row.address !== cleanUpstreamAddress(upstreamAddress)
  );
}

function isRecent(at: Date | null | undefined, now: number): boolean {
  return at != null && now - at.getTime() <= RETRY_AFTER_MS;
}

/**
 * Stores upstream cannot place and we have not placed either, or placed from
 * an address upstream has since changed, minus stores pinned in code and those
 * that every source failed
 * on within the last week: addresses rarely change, so retrying them daily
 * would only spend geocoder quota.
 */
export function findSyncTargets(
  upstream: StoreResponse[],
  locations: StoreLocationRow[],
  now = Date.now(),
  overrides = PIN_OVERRIDES,
): ISyncTarget[] {
  const byKey = new Map(
    locations.map((row) => [storeKey(row.chainCode, row.storeCode), row]),
  );

  return upstream
    .filter((store) => !sanitizeCoordinates(store.lat, store.lon))
    .filter((store) => !overrides.has(storeKey(store.chain_code, store.code)))
    .filter((store) => {
      const row = byKey.get(storeKey(store.chain_code, store.code));

      if (!row) return true;
      if (row.source === "manual") return false;
      if (row.lat != null) return isStalePin(row, store.address);

      return !isRecent(row.lastAttemptAt, now);
    })
    .map((store) => ({
      chain: store.chain_code,
      code: store.code,
      address: cleanUpstreamAddress(store.address),
      city: store.city,
      zipcode: store.zipcode,
      skipGeoapify: isRecent(
        byKey.get(storeKey(store.chain_code, store.code))?.geoapifyMissedAt,
        now,
      ),
    }));
}
