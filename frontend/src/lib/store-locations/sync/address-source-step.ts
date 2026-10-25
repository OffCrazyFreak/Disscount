import "server-only";

import { normalizeCity, streetsMatch } from "@/lib/store-locations/address-key";
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

    return lookup && sameStore(target, lookup) ? { ...target, lookup } : target;
  });
}

// A code the chain renumbered or reused would send the geocoder to another
// shop, so the chain's address must name upstream's town, street and number.
function sameStore(target: ISyncTarget, lookup: ILookupAddress): boolean {
  const ours = readPlacedAddress(target.address);
  const theirs = readPlacedAddress(lookup.address);
  const sameNumber =
    ours.number === null ||
    ours.number === theirs.number ||
    ours.rangeEnd === theirs.number;

  return (
    sameNumber &&
    streetsMatch(ours.tokens, theirs.tokens, true) &&
    sameTown(target.city, lookup.city)
  );
}

// "V.gorica" is Velika Gorica: an initial counts as the word it starts.
function sameTown(ours: string | null, theirs: string): boolean {
  const a = normalizeCity(ours).split(" ").filter(Boolean);
  const b = normalizeCity(theirs).split(" ").filter(Boolean);

  return (
    a.length === b.length &&
    a.every(
      (word, index) => b[index].startsWith(word) || word.startsWith(b[index]),
    )
  );
}
