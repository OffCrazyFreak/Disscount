import "server-only";

import type { StoreResponse } from "@/lib/cijene-api/schemas";
import { delay } from "@/lib/store-locations/http";
import { numberedRecord } from "@/lib/store-locations/sync/match-locator-store";
import { withoutSharedPoints } from "@/lib/store-locations/sync/shared-points";
import { ISyncTarget } from "@/lib/store-locations/sync/sync-target";
import type {
  ILocatorStore,
  IResolvedLocation,
} from "@/lib/store-locations/store-location-types";
import { serverEnv } from "@/lib/server-env";

type Point = { lat: number; lon: number };

// Geoapify's free plan allows 5 requests a second.
const GEOAPIFY_INTERVAL_MS = 250;

/** Settles a DGU address that exists in several places of one town, held to the locator step's rules. */
export function createDguAnchor(
  records: Map<string, ILocatorStore[]>,
  upstream: StoreResponse[],
  geocode: (
    address: string,
    city: string | null,
    signal: AbortSignal,
  ) => Promise<IResolvedLocation | null>,
  signal: AbortSignal,
): (target: ISyncTarget) => Promise<Point | null> {
  let geocoded = 0;

  return async (target) => {
    const chainCodes = upstream
      .filter((store) => store.chain_code === target.chain)
      .map((store) => store.code);
    const record = numberedRecord(
      target,
      withoutSharedPoints(records.get(target.chain) ?? []),
      chainCodes,
    );

    // A village point may make a number contested but never places a store.
    if (record) return record.approximate ? null : record;

    if (!target.address || target.skipGeoapify) return null;
    if (!serverEnv.GEOAPIFY_API_KEY) return null;

    if (geocoded++ > 0) await delay(GEOAPIFY_INTERVAL_MS, signal);

    try {
      return await geocode(target.address, target.city, signal);
    } catch (error) {
      if (signal.aborted) throw error;

      return null;
    }
  };
}
