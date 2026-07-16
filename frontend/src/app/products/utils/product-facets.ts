import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type { StoreLocation } from "@/typings/store-location";
import { normalizeForSearch } from "@/utils/strings";
import {
  getProductBrands,
  getProductCategories,
  normalizeChainCode,
} from "@/app/products/utils/product-filters";

export interface IFacetOption {
  value: string;
  count: number;
}

export interface IProductFacets {
  chains: IFacetOption[];
  locations: IFacetOption[];
  categories: IFacetOption[];
  brands: IFacetOption[];
}

export interface IFacetSelections {
  chains: string[];
  locations: string[];
  categories: string[];
  brands: string[];
}

interface IIndexedProduct {
  chainCodes: Set<string>;
  /** normalized -> display */
  categories: Map<string, string>;
  brands: Map<string, string>;
}

function indexProduct(product: ProductResponse): IIndexedProduct {
  const toDisplayMap = (values: string[]) =>
    new Map(values.map((value) => [normalizeForSearch(value), value]));

  return {
    chainCodes: new Set(
      product.chains.map((chainProduct) =>
        normalizeChainCode(chainProduct.chain)
      )
    ),
    categories: toDisplayMap(getProductCategories(product)),
    brands: toDisplayMap(getProductBrands(product)),
  };
}

function intersects(a: Set<string>, b: Set<string>): boolean {
  for (const value of a) {
    if (b.has(value)) return true;
  }
  return false;
}

function matchesAnyKey(selected: Set<string>, values: Map<string, string>) {
  if (selected.size === 0) return true;
  for (const key of selected) {
    if (values.has(key)) return true;
  }
  return false;
}

function toSortedOptions(
  counts: Map<string, { value: string; count: number }>
): IFacetOption[] {
  return [...counts.values()].sort((a, b) =>
    a.value.localeCompare(b.value, "hr", { sensitivity: "base" })
  );
}

/**
 * Standard faceted-search option computation over the current (unfiltered)
 * search results: each facet's options come from the products matching all
 * OTHER active facets, so a facet never narrows its own dropdown. If that
 * still empties a facet (the other selections have zero overlap), it falls
 * back to query-wide options so the user can pivot instead of dead-ending.
 */
export function computeProductFacets(
  products: ProductResponse[],
  locations: StoreLocation[],
  selections: IFacetSelections
): IProductFacets {
  const indexed = products.map(indexProduct);

  const selChains = new Set(selections.chains.map(normalizeChainCode));
  const selCategories = new Set(selections.categories.map(normalizeForSearch));
  const selBrands = new Set(selections.brands.map(normalizeForSearch));
  const selLocationNames = new Set(
    selections.locations.map(normalizeForSearch)
  );

  const locationChainSets = locations.map((location) => ({
    name: location.name,
    chains: new Set(location.chains.map(normalizeChainCode)),
  }));

  // Union of chain codes available in the selected cities (null = no filter)
  const selectedLocationChains = selLocationNames.size
    ? new Set(
        locationChainSets
          .filter((location) =>
            selLocationNames.has(normalizeForSearch(location.name))
          )
          .flatMap((location) => [...location.chains])
      )
    : null;

  const matchesChainOnly = (p: IIndexedProduct) =>
    selChains.size === 0 || intersects(p.chainCodes, selChains);

  const matchesLocationOnly = (p: IIndexedProduct) =>
    selectedLocationChains === null ||
    intersects(p.chainCodes, selectedLocationChains);

  // Chain + location combine as an intersection: one chain must satisfy both
  function matchesChainAndLocation(p: IIndexedProduct): boolean {
    if (selChains.size === 0) return matchesLocationOnly(p);
    if (selectedLocationChains === null) return matchesChainOnly(p);

    for (const code of p.chainCodes) {
      if (selChains.has(code) && selectedLocationChains.has(code)) return true;
    }
    return false;
  }

  const matchesCategories = (p: IIndexedProduct) =>
    matchesAnyKey(selCategories, p.categories);
  const matchesBrands = (p: IIndexedProduct) =>
    matchesAnyKey(selBrands, p.brands);

  function countChains(restrict: boolean): IFacetOption[] {
    const counts = new Map<string, { value: string; count: number }>();

    for (const p of indexed) {
      const matchesOthers =
        matchesLocationOnly(p) && matchesCategories(p) && matchesBrands(p);
      if (restrict && !matchesOthers) continue;

      for (const code of p.chainCodes) {
        if (
          restrict &&
          selectedLocationChains &&
          !selectedLocationChains.has(code)
        ) {
          continue;
        }
        const entry = counts.get(code) ?? { value: code, count: 0 };
        entry.count += 1;
        counts.set(code, entry);
      }
    }

    return toSortedOptions(counts);
  }

  function countLocations(restrict: boolean): IFacetOption[] {
    const counts = new Map<string, { value: string; count: number }>();

    for (const location of locationChainSets) {
      let count = 0;

      for (const p of indexed) {
        const matchesOthers =
          matchesChainOnly(p) && matchesCategories(p) && matchesBrands(p);
        if (restrict && !matchesOthers) continue;

        for (const code of p.chainCodes) {
          if (
            location.chains.has(code) &&
            (!restrict || selChains.size === 0 || selChains.has(code))
          ) {
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

  function countValues(
    pick: (p: IIndexedProduct) => Map<string, string>,
    matchesOthers: (p: IIndexedProduct) => boolean,
    restrict: boolean
  ): IFacetOption[] {
    const counts = new Map<string, { value: string; count: number }>();

    for (const p of indexed) {
      if (restrict && !matchesOthers(p)) continue;

      for (const [key, display] of pick(p)) {
        const entry = counts.get(key) ?? { value: display, count: 0 };
        entry.count += 1;
        counts.set(key, entry);
      }
    }

    return toSortedOptions(counts);
  }

  function withFallback(compute: (restrict: boolean) => IFacetOption[]) {
    const strict = compute(true);
    return strict.length > 0 ? strict : compute(false);
  }

  return {
    chains: withFallback(countChains),
    locations: withFallback(countLocations),
    categories: withFallback((restrict) =>
      countValues(
        (p) => p.categories,
        (p) => matchesChainAndLocation(p) && matchesBrands(p),
        restrict
      )
    ),
    brands: withFallback((restrict) =>
      countValues(
        (p) => p.brands,
        (p) => matchesChainAndLocation(p) && matchesCategories(p),
        restrict
      )
    ),
  };
}
