import type { IStoreLocation } from "@/typings/store-location";
import { normalizeForSearch } from "@/utils/strings";
import { normalizeChainCode } from "@/app/products/utils/product-filters";

/**
 * Resolves the chain + location filters into the chain codes a product may
 * appear in: null = unfiltered, empty array = selections with no overlap.
 * A city filters by the chains that have a store there.
 */
export function resolveAllowedChains(
  selectedChains: string[],
  selectedLocations: string[],
  locations: IStoreLocation[],
): string[] | null {
  if (selectedChains.length === 0 && selectedLocations.length === 0) {
    return null;
  }

  if (selectedLocations.length === 0) return selectedChains;

  const selectedLocationKeys = new Set(
    selectedLocations.map(normalizeForSearch),
  );
  const locationChains = new Set<string>();

  for (const location of locations) {
    if (!selectedLocationKeys.has(normalizeForSearch(location.name))) continue;

    location.chains.forEach((chain) =>
      locationChains.add(normalizeChainCode(chain)),
    );
  }

  // Both branches emit canonical codes. Comparing a raw selection against
  // normalized keys used to drop any chain whose casing came from a hand-edited
  // URL, and returning the raw spelling from one branch and normalized from the
  // other gave two cache keys for one filter, because callers build those keys
  // by joining this array.
  return selectedChains.length > 0
    ? selectedChains
        .map(normalizeChainCode)
        .filter((chain) => locationChains.has(chain))
    : [...locationChains];
}
