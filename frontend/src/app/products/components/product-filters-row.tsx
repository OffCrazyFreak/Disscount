"use client";

import ClearFiltersButton from "@/app/products/components/clear-filters-button";
import ProductFacetSelects from "@/app/products/components/product-facet-selects";
import useProductFacets from "@/app/products/hooks/use-product-facets";
import type { IUseProductFiltersResult } from "@/app/products/hooks/use-product-filters";

interface IProductFiltersRowProps {
  filters: IUseProductFiltersResult;
  query: string;
}

/** Every facet inline, for the widths that have room to show them all at once. */
export default function ProductFiltersRow({
  filters,
  query,
}: IProductFiltersRowProps) {
  const facets = useProductFacets(query, filters);

  return (
    <div className="flex w-full items-center gap-2">
      <ProductFacetSelects facets={facets} filters={filters} layout="row" />

      <ClearFiltersButton filters={filters} showLabel className="shrink-0" />
    </div>
  );
}
