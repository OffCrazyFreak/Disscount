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

// Pre-seeds every universe value at zero so unavailable options stay visible.
function seedOptions(universe: Iterable<[string, string]>): CountsByKey {
  const counts: CountsByKey = new Map();

  for (const [key, display] of universe) {
    if (!counts.has(key)) counts.set(key, { value: display, count: 0 });
  }

  return counts;
}

function increment(counts: CountsByKey, key: string, display: string): void {
  const entry = counts.get(key) ?? { value: display, count: 0 };
  entry.count += 1;

  counts.set(key, entry);
}

function toSortedOptions(counts: CountsByKey): IFacetOption[] {
  return [...counts.values()].sort((a, b) => compareHr(a.value, b.value));
}

// Every distinct value seen across the query results, so another facet reduces
// a value's count to zero rather than dropping it from the dropdown.
function collectUniverse(
  query: IFacetQuery,
  pick: (product: IIndexedProduct) => Map<string, string>,
): Map<string, string> {
  const universe = new Map<string, string>();

  for (const product of query.indexed) {
    for (const [key, display] of pick(product)) {
      if (!universe.has(key)) universe.set(key, display);
    }
  }

  return universe;
}

export function countChains(
  query: IFacetQuery,
  universe: string[],
): IFacetOption[] {
  const counts = seedOptions(
    universe.map((code): [string, string] => [code, code]),
  );
  const { selectedLocationChains } = query;

  for (const product of query.indexed) {
    const matchesOthers =
      matchesLocationOnly(query, product) &&
      matchesCategories(query, product) &&
      matchesBrands(query, product);

    if (!matchesOthers) continue;

    for (const code of product.chainCodes) {
      if (selectedLocationChains && !selectedLocationChains.has(code)) continue;

      increment(counts, code, code);
    }
  }

  return toSortedOptions(counts);
}

export function countLocations(query: IFacetQuery): IFacetOption[] {
  const counts = seedOptions(
    query.locations.map((location): [string, string] => [
      location.name,
      location.name,
    ]),
  );
  const { selectedChains } = query;

  for (const location of query.locations) {
    for (const product of query.indexed) {
      const matchesOthers =
        matchesChainOnly(query, product) &&
        matchesCategories(query, product) &&
        matchesBrands(query, product);

      if (!matchesOthers) continue;

      // One stocked chain in this city is enough for the product to count once
      for (const code of product.chainCodes) {
        const chainAllowed =
          selectedChains.size === 0 || selectedChains.has(code);

        if (location.chains.has(code) && chainAllowed) {
          increment(counts, location.name, location.name);
          break;
        }
      }
    }
  }

  return toSortedOptions(counts);
}

export function countValues(
  query: IFacetQuery,
  pick: (product: IIndexedProduct) => Map<string, string>,
  matchesOthers: (product: IIndexedProduct) => boolean,
): IFacetOption[] {
  const counts = seedOptions(collectUniverse(query, pick));

  for (const product of query.indexed) {
    if (!matchesOthers(product)) continue;

    for (const [key, display] of pick(product)) {
      increment(counts, key, display);
    }
  }

  return toSortedOptions(counts);
}
