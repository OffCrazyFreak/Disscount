"use client";

import ClearFiltersButton from "@/app/products/components/clear-filters-button";
import ProductFacetSelects from "@/app/products/components/product-facet-selects";
import ProductFiltersTrigger from "@/app/products/components/product-filters-trigger";
import useProductFacets from "@/app/products/hooks/use-product-facets";
import { useSearchSheet } from "@/context/search-sheet-context";
import type { IUseProductFiltersResult } from "@/app/products/hooks/use-product-filters";

interface IProductFiltersBarProps {
  filters: IUseProductFiltersResult;
  query: string;
}

/**
 * Every facet inline from md up. Below it the search sheet is the only filters
 * surface, so this button opens that sheet already expanded rather than a second
 * sheet of its own: a query and the facets narrowing it belong on one layer.
 *
 * The split is CSS, not a breakpoint hook, so nothing shifts on hydration.
 */
export default function ProductFiltersBar({
  filters,
  query,
}: IProductFiltersBarProps) {
  const facets = useProductFacets(query, filters);
  const { openFilters } = useSearchSheet();

  return (
    <div className="flex w-full items-center gap-2">
      <ProductFiltersTrigger
        count={filters.activeFilterCount}
        className="flex-1 md:hidden"
        onClick={openFilters}
      />

      <div className="hidden w-full items-center gap-2 md:flex">
        <ProductFacetSelects facets={facets} filters={filters} layout="row" />

        <ClearFiltersButton filters={filters} showLabel className="shrink-0" />
      </div>

      <ClearFiltersButton filters={filters} className="md:hidden" />
    </div>
  );
}
