import "server-only";

import { streetsMatch } from "@/lib/store-locations/address-key";
import { fetchStridonAddresses } from "@/lib/store-locations/sources/stridon-addresses";
import { readPlacedAddress } from "@/lib/store-locations/sync/address-place";
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
  let result = targets;

  for (const [chain, fetchAddresses] of Object.entries(ADDRESS_SOURCES)) {
    if (!targets.some((target) => target.chain === chain)) continue;

    const addresses = await fetchOrWarn(chain, fetchAddresses, signal);

    if (addresses) result = attachLookups(result, chain, addresses);
  }

  return result;
}

async function fetchOrWarn(
  chain: string,
  fetchAddresses: (signal: AbortSignal) => Promise<Map<string, ILookupAddress>>,
  signal: AbortSignal,
): Promise<Map<string, ILookupAddress> | null> {
  try {
    return await fetchAddresses(signal);
  } catch (error) {
    if (signal.aborted) throw error;

    console.warn(`[store-locations] ${chain} addresses failed`, error);

    return null;
  }
}

function attachLookups(
  targets: ISyncTarget[],
  chain: string,
  addresses: Map<string, ILookupAddress>,
): ISyncTarget[] {
  return targets.map((target) => {
    const lookup =
      target.chain === chain ? addresses.get(target.code) : undefined;

    return lookup && sameStore(target.address, lookup.address)
      ? { ...target, lookup }
      : target;
  });
}

// A code the chain renumbered or reused would send the geocoder to another
// shop, so the chain's address must name upstream's street and number.
function sameStore(upstream: string | null, chain: string): boolean {
  const ours = readPlacedAddress(upstream);
  const theirs = readPlacedAddress(chain);

  return (
    streetsMatch(ours.tokens, theirs.tokens, true) &&
    (ours.number === null || ours.number === theirs.number)
  );
}
