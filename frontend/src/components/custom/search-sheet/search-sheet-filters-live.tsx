"use client";

import ProductFacetSelects from "@/app/products/components/product-facet-selects";
import useProductFacets from "@/app/products/hooks/use-product-facets";
import useProductFilters from "@/app/products/hooks/use-product-filters";
import { useSearchNavigation } from "@/hooks/use-search-navigation";
import SearchSheetClearFilters from "@/components/custom/search-sheet/search-sheet-clear-filters";

/**
 * On the products list itself, where a pick amends the URL and the list behind
 * updates live. The facets come from the submitted query the page already holds,
 * so this adds no request of its own.
 */
export default function SearchSheetFiltersLive() {
  // The page owns the seeding; a second reader racing it double-appends params.
  const filters = useProductFilters({ seedPreferred: false });
  const { routeQuery } = useSearchNavigation("/products");
  const facets = useProductFacets(routeQuery, filters);

  return (
    <>
      <ProductFacetSelects facets={facets} filters={filters} layout="stack" />

      <SearchSheetClearFilters
        disabled={filters.activeFilterCount === 0}
        onClear={filters.clearFilters}
      />
    </>
  );
}
