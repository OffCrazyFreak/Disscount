"use client";

import ClearFiltersButton from "@/app/products/components/clear-filters-button";
import ProductFiltersRow from "@/app/products/components/product-filters-row";
import ProductFiltersTrigger from "@/app/products/components/product-filters-trigger";
import { useProductsSheet } from "@/context/products-sheet-context";
import { useIsMobile } from "@/hooks/use-mobile";
import type { IUseProductFiltersResult } from "@/app/products/hooks/use-product-filters";

interface IProductFiltersBarProps {
  filters: IUseProductFiltersResult;
  query: string;
}

/**
 * The filters for the list: inline where there is room, and below `md` a button
 * that opens the products sheet with its filters already expanded.
 *
 * The page used to carry a filters sheet of its own, which meant two sheets built
 * from the same controls. Now there is one, so a query and the facets narrowing it
 * are never split across two layers.
 */
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

      <ClearFiltersButton filters={filters} showLabel className="shrink-0" />
    </div>
  );
}
