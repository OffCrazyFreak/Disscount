import "server-only";

import { fetchStridonAddresses } from "@/lib/store-locations/sources/stridon-addresses";
import { ISyncTarget } from "@/lib/store-locations/sync/sync-target";
import type { ILookupAddress } from "@/lib/store-locations/types";

// Chains that publish clean addresses but no coordinates.
const ADDRESS_SOURCES: Record<
  string,
  (signal: AbortSignal) => Promise<Map<string, ILookupAddress>>
> = {
  stridon: fetchStridonAddresses,
};

/**
 * Gives targets their chain's fuller address for the geocoders. It runs after
 * the DGU step on purpose: DGU's stem matching pinned "Ljudevita Posavskog"
 * on Posavska ulica in another village, while Geoapify found the building.
 */
export async function withChainAddresses(
  targets: ISyncTarget[],
  signal: AbortSignal,
): Promise<ISyncTarget[]> {
  const result = [...targets];

  for (const [chain, fetchAddresses] of Object.entries(ADDRESS_SOURCES)) {
    if (!targets.some((target) => target.chain === chain)) continue;

    try {
      const addresses = await fetchAddresses(signal);

      for (const [index, target] of result.entries()) {
        const lookup =
          target.chain === chain ? addresses.get(target.code) : undefined;

        if (lookup) result[index] = { ...target, lookup };
      }
    } catch (error) {
      console.warn(`[store-locations] ${chain} addresses failed`, error);
    }
  }

  return result;
}
