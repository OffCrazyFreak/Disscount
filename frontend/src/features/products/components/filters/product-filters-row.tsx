"use client";

import ClearFiltersButton from "@/features/products/components/filters/clear-filters-button";
import ProductFacetSelects from "@/features/products/components/filters/product-facet-selects";
import useProductFacets from "@/features/products/hooks/filters/use-product-facets";
import type { IUseProductFiltersResult } from "@/features/products/hooks/filters/use-product-filters";

interface IProductFiltersRowProps {
  filters: IUseProductFiltersResult;
  query: string;
}

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
