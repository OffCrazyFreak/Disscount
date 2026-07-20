import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type { StoreLocation } from "@/typings/store-location";
import { normalizeForSearch } from "@/utils/strings";
import {
  getProductBrands,
  getProductCategories,
  normalizeChainCode,
} from "@/app/products/utils/product-filters";
import type {
  IFacetQuery,
  IFacetSelections,
  IIndexedProduct,
  ILocationChains,
} from "@/app/products/utils/facets/types";

function toDisplayMap(values: string[]): Map<string, string> {
  return new Map(values.map((value) => [normalizeForSearch(value), value]));
}

function indexProduct(product: ProductResponse): IIndexedProduct {
  return {
    chainCodes: new Set(
      product.chains.map((chainProduct) =>
        normalizeChainCode(chainProduct.chain),
      ),
    ),
    categories: toDisplayMap(getProductCategories(product)),
    brands: toDisplayMap(getProductBrands(product)),
  };
}

function toLocationChains(locations: StoreLocation[]): ILocationChains[] {
  return locations.map((location) => ({
    name: location.name,
    chains: new Set(location.chains.map(normalizeChainCode)),
  }));
}

/** Every chain reachable in the selected cities, or null when none is selected */
function resolveLocationChains(
  locations: ILocationChains[],
  selectedNames: Set<string>,
): Set<string> | null {
  if (selectedNames.size === 0) return null;

  return new Set(
    locations
      .filter((location) =>
        selectedNames.has(normalizeForSearch(location.name)),
      )
      .flatMap((location) => [...location.chains]),
  );
}

/** Normalizes products and selections once, up front, for the counters to use */
export function buildFacetQuery(
  products: ProductResponse[],
  locations: StoreLocation[],
  selections: IFacetSelections,
): IFacetQuery {
  const locationChains = toLocationChains(locations);

  return {
    indexed: products.map(indexProduct),
    locations: locationChains,
    selectedChains: new Set(selections.chains.map(normalizeChainCode)),
    selectedCategories: new Set(selections.categories.map(normalizeForSearch)),
    selectedBrands: new Set(selections.brands.map(normalizeForSearch)),
    selectedLocationChains: resolveLocationChains(
      locationChains,
      new Set(selections.locations.map(normalizeForSearch)),
    ),
  };
}
