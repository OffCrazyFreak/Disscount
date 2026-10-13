import "server-only";

import { delay } from "@/lib/store-locations/http";
import { saveResolvedLocation } from "@/lib/store-locations/location-repository";
import { IResolvedLocation } from "@/lib/store-locations/types";
import { ISyncTarget } from "@/lib/store-locations/sync/sync-target";

type Geocode = (
  address: string,
  city: string | null,
  signal: AbortSignal,
) => Promise<IResolvedLocation | null>;

interface IGeocoderStepOptions {
  geocode: Geocode;
  /** Most requests one run may spend, so quota lasts across days. */
  limit: number;
  intervalMs: number;
}

interface IGeocoderStepResult {
  remaining: ISyncTarget[];
  /** Targets this provider answered for and could not place. */
  failed: ISyncTarget[];
}

/**
 * Geocodes targets one at a time at the provider's pace. Targets past the
 * limit stay in the remaining list untouched, so the next run picks them up.
 */
export async function resolveWithGeocoder(
  targets: ISyncTarget[],
  { geocode, limit, intervalMs }: IGeocoderStepOptions,
  signal: AbortSignal,
): Promise<IGeocoderStepResult> {
  const remaining: ISyncTarget[] = [];
  const failed: ISyncTarget[] = [];
  let spent = 0;

  for (const target of targets) {
    if (!target.address || spent >= limit) {
      remaining.push(target);
      continue;
    }

    signal.throwIfAborted();

    if (spent > 0) await delay(intervalMs, signal);
    spent++;

    try {
      const location = await geocode(target.address, target.city, signal);

      if (location) {
        await saveResolvedLocation(target, location);
        continue;
      }

      failed.push(target);
    } catch (error) {
      if (signal.aborted) throw error;

      // A rate limit or outage says nothing about the address, so it is
      // retried next run instead of waiting out the 7-day backoff.
      console.warn(
        `[store-locations] geocoding ${target.chain}:${target.code} failed`,
        error,
      );
    }

    remaining.push(target);
  }

  return { remaining, failed };
}
