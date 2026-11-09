import "server-only";

import { normalizeCity, streetsMatch } from "@/lib/store-locations/address-key";
import { fetchStridonAddresses } from "@/lib/store-locations/sources/stridon-addresses";
import { readPlacedAddress } from "@/lib/store-locations/sync/address-place";
import { ISyncTarget } from "@/lib/store-locations/sync/sync-target";
import type { ILookupAddress } from "@/lib/store-locations/store-location-types";

// Chains that publish clean addresses but no coordinates.
const ADDRESS_SOURCES: Record<
  string,
  (signal: AbortSignal) => Promise<Map<string, ILookupAddress>>
> = {
  stridon: fetchStridonAddresses,
};

/** After DGU, whose stem matching pinned "Ljudevita Posavskog" on another village's Posavska; Geoapify found it. */
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

// A renumbered or reused code would send the geocoder to another shop, so the address must name upstream's place.
function sameStore(target: ISyncTarget, lookup: ILookupAddress): boolean {
  const ours = readPlacedAddress(target.address);
  const theirs = readPlacedAddress(lookup.address);
  const sameNumber =
    ours.number === null ||
    ours.number === theirs.number ||
    (ours.rangeEnd !== null && ours.rangeEnd === theirs.number);

  return (
    sameNumber &&
    streetsMatch(ours.tokens, theirs.tokens, true) &&
    sameTown(target.city, lookup.city)
  );
}

// "V.gorica" is Velika Gorica: a dotted word counts as the word it starts, but "Split" never means "Splitska".
function sameTown(ours: string | null, theirs: string): boolean {
  const a = townWords(ours ?? "");
  const b = townWords(theirs);

  return (
    a.length === b.length &&
    a.every(
      (word, index) =>
        word.text === b[index].text ||
        (word.short && b[index].text.startsWith(word.text)) ||
        (b[index].short && word.text.startsWith(b[index].text)),
    )
  );
}

function townWords(city: string): { text: string; short: boolean }[] {
  return [...city.matchAll(/([^\s.]+)(\.?)/g)].flatMap(([, word, dot]) => {
    const parts = normalizeCity(word).split(" ").filter(Boolean);

    return parts.map((text, index) => ({
      text,
      short: dot === "." && index === parts.length - 1,
    }));
  });
}
