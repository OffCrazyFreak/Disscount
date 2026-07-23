import type {
  IFacetQuery,
  IIndexedProduct,
} from "@/app/products/utils/facets/types";

function intersects(a: Set<string>, b: Set<string>): boolean {
  for (const value of a) {
    if (b.has(value)) return true;
  }

  return false;
}

function matchesAnyKey(
  selected: Set<string>,
  values: Map<string, string>,
): boolean {
  if (selected.size === 0) return true;

  for (const key of selected) {
    if (values.has(key)) return true;
  }

  return false;
}

export function matchesChainOnly(
  query: IFacetQuery,
  product: IIndexedProduct,
): boolean {
  return (
    query.selectedChains.size === 0 ||
    intersects(product.chainCodes, query.selectedChains)
  );
}

export function matchesLocationOnly(
  query: IFacetQuery,
  product: IIndexedProduct,
): boolean {
  return (
    query.selectedLocationChains === null ||
    intersects(product.chainCodes, query.selectedLocationChains)
  );
}

/** Chain and location intersect: one chain must satisfy both, not either */
export function matchesChainAndLocation(
  query: IFacetQuery,
  product: IIndexedProduct,
): boolean {
  const { selectedChains, selectedLocationChains } = query;

  if (selectedChains.size === 0) return matchesLocationOnly(query, product);
  if (selectedLocationChains === null) return matchesChainOnly(query, product);

  for (const code of product.chainCodes) {
    if (selectedChains.has(code) && selectedLocationChains.has(code)) {
      return true;
    }
  }

  return false;
}

export function matchesCategories(
  query: IFacetQuery,
  product: IIndexedProduct,
): boolean {
  return matchesAnyKey(query.selectedCategories, product.categories);
}

export function matchesBrands(
  query: IFacetQuery,
  product: IIndexedProduct,
): boolean {
  return matchesAnyKey(query.selectedBrands, product.brands);
}
