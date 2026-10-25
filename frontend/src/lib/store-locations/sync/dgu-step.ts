import "server-only";

import { lookupDguAddresses } from "@/lib/store-locations/dgu/dgu-address-lookup";
import type { IDguResult } from "@/lib/store-locations/dgu/dgu-resolve";
import { pickNearAnchor } from "@/lib/store-locations/dgu/near-anchor";
import { saveResolvedLocation } from "@/lib/store-locations/location-repository";
import { storeKey } from "@/lib/store-locations/upstream-stores";
import { ISyncTarget } from "@/lib/store-locations/sync/sync-target";

/**
 * Places targets against the official address register. The register is one
 * 84 MB download streamed per run, so it is skipped when nothing is left to
 * place, and a failed download only defers its targets to the geocoders.
 * An address the town has in far-apart places is placed only where an
 * independent source puts the store.
 */
export async function resolveWithDgu(
  targets: ISyncTarget[],
  signal: AbortSignal,
  anchorFor: (
    target: ISyncTarget,
  ) => Promise<{ lat: number; lon: number } | null>,
): Promise<ISyncTarget[]> {
  const withAddress = targets.filter((target) => target.address);
  if (withAddress.length === 0) return targets;

  let result: IDguResult;

  try {
    result = await lookupDguAddresses(
      withAddress.map((target) => ({
        id: storeKey(target.chain, target.code),
        address: target.address ?? "",
        city: target.city,
      })),
      signal,
    );
  } catch (error) {
    console.warn("[store-locations] DGU lookup failed", error);
    return targets;
  }

  const remaining: ISyncTarget[] = [];

  for (const target of targets) {
    const key = storeKey(target.chain, target.code);
    const places = result.ambiguous.get(key);
    const anchor = places ? await anchorFor(target) : null;
    const point =
      result.found.get(key) ??
      (places && anchor ? pickNearAnchor(places, anchor) : null);

    if (point) {
      await saveResolvedLocation(target, {
        ...point,
        source: "dgu",
        precision: "building",
      });
    } else {
      remaining.push(target);
    }
  }

  return remaining;
}
