import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type { IStoreLocation } from "@/typings/store-location";
import type {
  IFacetSelections,
  IProductFacets,
} from "@/app/[locale]/products/utils/facets/facet-types";
import { buildFacetQuery } from "@/app/[locale]/products/utils/facets/facet-query";
import {
  matchesBrands,
  matchesCategories,
  matchesChainAndLocation,
} from "@/app/[locale]/products/utils/facets/facet-matchers";
import {
  countChains,
  countLocations,
  countValues,
} from "@/app/[locale]/products/utils/facets/facet-counters";

export type {
  IFacetOption,
  IFacetSelections,
  IProductFacets,
} from "@/app/[locale]/products/utils/facets/facet-types";

/** Each facet is counted against products matching all other active facets, so a facet never narrows its own dropdown. */
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
