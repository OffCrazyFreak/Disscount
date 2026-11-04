"use client";

import ClearFiltersButton from "@/app/[locale]/products/components/clear-filters-button";
import ProductFiltersRow from "@/app/[locale]/products/components/product-filters-row";
import ProductFiltersTrigger from "@/app/[locale]/products/components/product-filters-trigger";
import { useProductsSheet } from "@/context/products-sheet-context";
import { useIsMobile } from "@/hooks/use-mobile";
import type { IUseProductFiltersResult } from "@/app/[locale]/products/hooks/use-product-filters";

interface IProductFiltersBarProps {
  filters: IUseProductFiltersResult;
  query: string;
}

/** Below `md` a button opens the products sheet expanded, so a query and the facets narrowing it are never split across two layers. */
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
