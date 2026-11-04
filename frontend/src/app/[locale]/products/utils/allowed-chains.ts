import type { IStoreLocation } from "@/typings/store-location";
import { normalizeForSearch } from "@/utils/strings";
import { normalizeChainCode } from "@/app/[locale]/products/utils/product-filters";

/** A city filters by the chains that have a store there; null means unfiltered and an empty array means no overlap. */
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

  // Both branches emit canonical codes, because callers join this array into cache keys and a raw spelling would give two keys for one filter.
  return selectedChains.length > 0
    ? selectedChains
        .map(normalizeChainCode)
        .filter((chain) => locationChains.has(chain))
    : [...locationChains];
}
