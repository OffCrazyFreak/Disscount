import "server-only";

import type { StoreResponse } from "@/lib/cijene-api/schemas";
import { saveResolvedLocation } from "@/lib/store-locations/location-repository";
import { storeLocators } from "@/lib/store-locations/sources";
import { matchLocatorStore } from "@/lib/store-locations/sync/match-locator-store";
import { ISyncTarget } from "@/lib/store-locations/sync/sync-target";
import type { ILocatorStore } from "@/lib/store-locations/types";

/**
 * Places targets from their chain's own store locator. One chain failing (a
 * redesigned site, a block) only skips that chain; its stores fall through to
 * the next source.
 */
export async function resolveWithLocators(
  targets: ISyncTarget[],
  upstream: StoreResponse[],
  signal: AbortSignal,
): Promise<{
  remaining: ISyncTarget[];
  records: Map<string, ILocatorStore[]>;
}> {
  const remaining: ISyncTarget[] = [];
  // Kept for the DGU step, which checks ambiguous addresses against them.
  const records = new Map<string, ILocatorStore[]>();
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
    // Every upstream code, placed stores included, so a store number two
    // codes end in stays ambiguous.
    const chainCodes = upstream
      .filter((store) => store.chain_code === chain)
      .map((store) => store.code);

    try {
      const chainRecords = await locator.fetchStores(signal);

      records.set(chain, chainRecords);

      for (const target of chainTargets) {
        const match = matchLocatorStore(target, chainRecords, chainCodes);
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

  return { remaining, records };
}
