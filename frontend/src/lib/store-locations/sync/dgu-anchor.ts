import "server-only";

import { geocodeWithGeoapify } from "@/lib/store-locations/geocoders/geoapify-geocoder";
import { delay } from "@/lib/store-locations/http";
import { carriesSuffix } from "@/lib/store-locations/sync/match-locator-store";
import { withoutSharedPoints } from "@/lib/store-locations/sync/shared-points";
import { ISyncTarget } from "@/lib/store-locations/sync/sync-target";
import type { ILocatorStore } from "@/lib/store-locations/types";

type Point = { lat: number; lon: number };

// Geoapify's free plan allows 5 requests a second.
const GEOAPIFY_INTERVAL_MS = 250;

/**
 * An independent point for a store, to settle a DGU address that exists in
 * several places of one town: the chain's own record for exactly this store,
 * or else a building Geoapify is sure of.
 */
export function createDguAnchor(
  records: Map<string, ILocatorStore[]>,
  signal: AbortSignal,
): (target: ISyncTarget) => Promise<Point | null> {
  let geocoded = 0;

  return async (target) => {
    const record = recordFor(target, records.get(target.chain) ?? []);

    if (record) return { lat: record.lat, lon: record.lon };
    if (!target.address || !process.env.GEOAPIFY_API_KEY) return null;

    if (geocoded++ > 0) await delay(GEOAPIFY_INTERVAL_MS, signal);

    try {
      return await geocodeWithGeoapify(target.address, target.city, signal);
    } catch (error) {
      if (signal.aborted) throw error;

      return null;
    }
  };
}

function recordFor(
  target: ISyncTarget,
  records: ILocatorStore[],
): ILocatorStore | undefined {
  const trusted = withoutSharedPoints(records).filter(
    (record) => !record.approximate,
  );
  const byCode = trusted.filter((record) => record.code === target.code);
  const byNumber = trusted.filter(
    ({ codeSuffix }) => codeSuffix && carriesSuffix(target.code, codeSuffix),
  );
  const [match] = byCode.length > 0 ? byCode : byNumber;

  return (byCode.length || byNumber.length) === 1 ? match : undefined;
}
