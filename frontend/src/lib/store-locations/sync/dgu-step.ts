import "server-only";

import { lookupDguAddresses } from "@/lib/store-locations/dgu/dgu-address-lookup";
import { saveResolvedLocation } from "@/lib/store-locations/location-repository";
import { storeKey } from "@/lib/store-locations/upstream-stores";
import { ISyncTarget } from "@/lib/store-locations/sync/sync-target";

/**
 * Places targets against the official address register. The register is one
 * 84 MB download streamed per run, so it is skipped when nothing is left to
 * place, and a failed download only defers its targets to the geocoders.
 */
export async function resolveWithDgu(
  targets: ISyncTarget[],
  signal: AbortSignal,
): Promise<ISyncTarget[]> {
  const withAddress = targets.filter((target) => target.address);
  if (withAddress.length === 0) return targets;

  let found: Map<string, { lat: number; lon: number }>;

  try {
    found = await lookupDguAddresses(
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
    const point = found.get(storeKey(target.chain, target.code));

    if (point) {
      await saveResolvedLocation(target.chain, target.code, {
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
