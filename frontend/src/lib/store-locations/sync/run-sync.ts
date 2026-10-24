import "server-only";

import { geocodeWithGeoapify } from "@/lib/store-locations/geocoders/geoapify-geocoder";
import {
  geocodeWithNominatim,
  NOMINATIM_MIN_INTERVAL_MS,
} from "@/lib/store-locations/geocoders/nominatim-geocoder";
import {
  readStoreLocations,
  recordFailedAttempt,
  recordGeoapifyMiss,
} from "@/lib/store-locations/location-repository";
import { fetchUpstreamStores } from "@/lib/store-locations/upstream-stores";
import { resolveWithDgu } from "@/lib/store-locations/sync/dgu-step";
import { resolveWithGeocoder } from "@/lib/store-locations/sync/geocoder-step";
import { resolveWithLocators } from "@/lib/store-locations/sync/locator-step";
import {
  acquireSyncLease,
  releaseSyncLease,
} from "@/lib/store-locations/sync/sync-lease";
import { findSyncTargets } from "@/lib/store-locations/sync/sync-target";

// Geoapify's free plan allows 3,000 requests a day at 5 a second.
const GEOAPIFY = { limit: 1_000, intervalMs: 250 };

// Public Nominatim is the last resort, so a run spends only a few minutes on
// it; whatever is left waits for the next day.
const NOMINATIM_LIMIT = 20;

/**
 * Places every store upstream cannot, each source a backup for the one
 * before: chain locators, the DGU address register, Geoapify, Nominatim.
 * Stores that all of them miss are retried a week later, and a manual pin
 * is never overwritten.
 */
export async function runStoreLocationSync(signal: AbortSignal): Promise<void> {
  if (!(await acquireSyncLease())) return;

  let failure: string | null = null;

  try {
    const [upstream, locations] = await Promise.all([
      fetchUpstreamStores(),
      readStoreLocations(),
    ]);

    let targets = findSyncTargets(upstream, locations);
    targets = await resolveWithLocators(targets, upstream, signal);
    targets = await resolveWithDgu(targets, signal);

    // Optional: until the key is set, every target goes straight to Nominatim.
    const forGeoapify = process.env.GEOAPIFY_API_KEY
      ? targets.filter((target) => !target.skipGeoapify)
      : [];
    const geoapify = await resolveWithGeocoder(
      forGeoapify,
      { geocode: geocodeWithGeoapify, ...GEOAPIFY },
      signal,
    );

    for (const target of geoapify.failed) {
      await recordGeoapifyMiss(target.chain, target.code);
    }

    const notForGeoapify = targets.filter(
      (target) => !forGeoapify.includes(target),
    );

    const nominatim = await resolveWithGeocoder(
      [...geoapify.remaining, ...notForGeoapify],
      {
        geocode: geocodeWithNominatim,
        limit: NOMINATIM_LIMIT,
        intervalMs: NOMINATIM_MIN_INTERVAL_MS,
      },
      signal,
    );

    // The week-long wait starts only once the last source has missed too.
    const missed = new Set(nominatim.failed);
    const unplaced = nominatim.remaining.filter(
      (target) => !target.address || missed.has(target),
    );

    for (const target of unplaced) {
      await recordFailedAttempt(target.chain, target.code);
    }
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
    console.error("[store-locations] sync failed", error);
  } finally {
    await releaseSyncLease(failure);
  }
}
