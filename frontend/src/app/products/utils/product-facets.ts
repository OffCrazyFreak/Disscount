import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type { IStoreLocation } from "@/typings/store-location";
import type {
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
 * Disjunctive faceting over the current search results: each facet is counted
 * against the products matching all OTHER active facets, so a facet never
 * narrows its own dropdown. Options come from a stable universe (every chain,
 * every location, every value seen for this query) and unavailable ones stay
 * visible at zero instead of disappearing.
 */
export function computeProductFacets(
  products: ProductResponse[],
  locations: IStoreLocation[],
  selections: IFacetSelections,
  chainUniverse: string[],
): IProductFacets {
  const query = buildFacetQuery(products, locations, selections);

  return {
    chains: countChains(query, chainUniverse),
    locations: countLocations(query),
    categories: countValues(
      query,
      (product) => product.categories,
      (product) =>
        matchesChainAndLocation(query, product) &&
        matchesBrands(query, product),
    ),
    brands: countValues(
      query,
      (product) => product.brands,
      (product) =>
        matchesChainAndLocation(query, product) &&
        matchesCategories(query, product),
    ),
  };
}
