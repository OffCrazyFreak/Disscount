"use client";

import ClearFiltersButton from "@/features/products/components/filters/clear-filters-button";
import ProductFiltersRow from "@/features/products/components/filters/product-filters-row";
import ProductFiltersTrigger from "@/features/products/components/filters/product-filters-trigger";
import { useProductsSheet } from "@/context/products-sheet-context";
import { useIsMobile } from "@/hooks/use-mobile";
import type { IUseProductFiltersResult } from "@/features/products/hooks/filters/use-product-filters";

interface IProductFiltersBarProps {
  filters: IUseProductFiltersResult;
  query: string;
}

/** Below `md` the products sheet opens expanded, so a query and its facets share one layer. */
export default function ProductFiltersBar({
  filters,
  query,
}: IProductFiltersBarProps) {
  const isMobile = useIsMobile();
  const { openFilters } = useProductsSheet();

  if (!isMobile) return <ProductFiltersRow filters={filters} query={query} />;

  return (
    <div className="flex w-full items-center gap-2">
      <ProductFiltersTrigger
        count={filters.activeFilterCount}
        className="flex-1"
        onClick={openFilters}
      />

      <ClearFiltersButton filters={filters} className="shrink-0" />
    </div>
  );
}
