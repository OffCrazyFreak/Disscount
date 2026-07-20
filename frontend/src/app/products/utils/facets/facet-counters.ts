import { compareHr } from "@/utils/strings";
import type {
  IFacetOption,
  IFacetQuery,
  IIndexedProduct,
} from "@/app/products/utils/facets/types";
import {
  matchesBrands,
  matchesCategories,
  matchesChainOnly,
  matchesLocationOnly,
} from "@/app/products/utils/facets/facet-matchers";

type CountsByKey = Map<string, IFacetOption>;

function increment(counts: CountsByKey, key: string, display: string): void {
  const entry = counts.get(key) ?? { value: display, count: 0 };
  entry.count += 1;

  counts.set(key, entry);
}

function toSortedOptions(counts: CountsByKey): IFacetOption[] {
  return [...counts.values()].sort((a, b) => compareHr(a.value, b.value));
}

export function countChains(
  query: IFacetQuery,
  restrict: boolean,
): IFacetOption[] {
  const counts: CountsByKey = new Map();
  const { selectedLocationChains } = query;

  for (const product of query.indexed) {
    const matchesOthers =
      matchesLocationOnly(query, product) &&
      matchesCategories(query, product) &&
      matchesBrands(query, product);

    if (restrict && !matchesOthers) continue;

    for (const code of product.chainCodes) {
      if (
        restrict &&
        selectedLocationChains &&
        !selectedLocationChains.has(code)
      ) {
        continue;
      }

      increment(counts, code, code);
    }
  }

  return toSortedOptions(counts);
}

export function countLocations(
  query: IFacetQuery,
  restrict: boolean,
): IFacetOption[] {
  const counts: CountsByKey = new Map();
  const { selectedChains } = query;

  for (const location of query.locations) {
    let count = 0;

    for (const product of query.indexed) {
      const matchesOthers =
        matchesChainOnly(query, product) &&
        matchesCategories(query, product) &&
        matchesBrands(query, product);

      if (restrict && !matchesOthers) continue;

      // One stocked chain in this city is enough for the product to count once
      for (const code of product.chainCodes) {
        const chainAllowed =
          !restrict || selectedChains.size === 0 || selectedChains.has(code);

        if (location.chains.has(code) && chainAllowed) {
          count += 1;
          break;
        }
      }
    }

    if (count > 0) {
      counts.set(location.name, { value: location.name, count });
    }
  }

  return toSortedOptions(counts);
}

export function countValues(
  query: IFacetQuery,
  pick: (product: IIndexedProduct) => Map<string, string>,
  matchesOthers: (product: IIndexedProduct) => boolean,
  restrict: boolean,
): IFacetOption[] {
  const counts: CountsByKey = new Map();

  for (const product of query.indexed) {
    if (restrict && !matchesOthers(product)) continue;

    for (const [key, display] of pick(product)) {
      increment(counts, key, display);
    }
  }

  return toSortedOptions(counts);
}
