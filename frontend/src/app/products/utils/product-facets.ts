import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type { StoreLocation } from "@/typings/store-location";
import type {
  IFacetOption,
  IFacetSelections,
  IProductFacets,
} from "@/app/products/utils/facets/types";
import { buildFacetQuery } from "@/app/products/utils/facets/facet-query";
import {
  matchesBrands,
  matchesCategories,
  matchesChainAndLocation,
} from "@/app/products/utils/facets/facet-matchers";
import {
  countChains,
  countLocations,
  countValues,
} from "@/app/products/utils/facets/facet-counters";

export type {
  IFacetOption,
  IFacetSelections,
  IProductFacets,
} from "@/app/products/utils/facets/types";

/**
 * Falls back to query-wide options when the other selections leave a facet
 * empty, so the user can pivot instead of dead-ending.
 */
function withFallback(
  compute: (restrict: boolean) => IFacetOption[],
): IFacetOption[] {
  const strict = compute(true);

  return strict.length > 0 ? strict : compute(false);
}

/**
 * Standard faceted-search option computation over the current (unfiltered)
 * search results: each facet's options come from the products matching all
 * OTHER active facets, so a facet never narrows its own dropdown.
 */
export function computeProductFacets(
  products: ProductResponse[],
  locations: StoreLocation[],
  selections: IFacetSelections,
): IProductFacets {
  const query = buildFacetQuery(products, locations, selections);

  return {
    chains: withFallback((restrict) => countChains(query, restrict)),
    locations: withFallback((restrict) => countLocations(query, restrict)),
    categories: withFallback((restrict) =>
      countValues(
        query,
        (product) => product.categories,
        (product) =>
          matchesChainAndLocation(query, product) && matchesBrands(query, product),
        restrict,
      ),
    ),
    brands: withFallback((restrict) =>
      countValues(
        query,
        (product) => product.brands,
        (product) =>
          matchesChainAndLocation(query, product) &&
          matchesCategories(query, product),
        restrict,
      ),
    ),
  };
}
