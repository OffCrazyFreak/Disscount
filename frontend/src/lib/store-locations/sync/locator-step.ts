import "server-only";

import { saveResolvedLocation } from "@/lib/store-locations/location-repository";
import { storeLocators } from "@/lib/store-locations/sources";
import { withoutSharedPoints } from "@/lib/store-locations/sync/address-place";
import { matchLocatorStore } from "@/lib/store-locations/sync/match-locator-store";
import { ISyncTarget } from "@/lib/store-locations/sync/sync-target";

/**
 * Places targets from their chain's own store locator. One chain failing (a
 * redesigned site, a block) only skips that chain; its stores fall through to
 * the next source.
 */
export async function resolveWithLocators(
  targets: ISyncTarget[],
  signal: AbortSignal,
): Promise<ISyncTarget[]> {
  const remaining: ISyncTarget[] = [];
  const chains = new Set(targets.map((target) => target.chain));

  for (const chain of chains) {
    const chainTargets = targets.filter((target) => target.chain === chain);
    const locator = storeLocators.find(
      (candidate) => candidate.chain === chain,
    );

    if (!locator) {
      remaining.push(...chainTargets);
      continue;
    }

    const placed = new Set<ISyncTarget>();

    try {
      const records = withoutSharedPoints(await locator.fetchStores(signal));

      for (const target of chainTargets) {
        const match = matchLocatorStore(target, records);
        if (!match) continue;

        await saveResolvedLocation(target, {
          lat: match.lat,
          lon: match.lon,
          source: "chain_locator",
          precision: "building",
        });
        placed.add(target);
      }
    } catch (error) {
      console.warn(`[store-locations] ${chain} locator failed`, error);
    }

    // Stores saved before a failure keep their locator pin; only the rest
    // fall through to the next source.
    remaining.push(...chainTargets.filter((target) => !placed.has(target)));
  }

  return remaining;
}
