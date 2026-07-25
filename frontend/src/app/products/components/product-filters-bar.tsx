"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProductFacetSelects from "@/app/products/components/product-facet-selects";
import useProductFacets from "@/app/products/hooks/use-product-facets";
import type { IUseProductFiltersResult } from "@/app/products/hooks/use-product-filters";
import { useSearchSheet } from "@/context/search-sheet-context";

interface IProductFiltersBarProps {
  filters: IUseProductFiltersResult;
  query: string;
}

/**
 * Below md the search sheet is the only filters surface, so this is just its
 * entry point: two surfaces built from the same four controls put a query and
 * the facets narrowing it on separate layers. Above md the facets stay inline.
 */
export default function ProductFiltersBar({
  filters,
  query,
}: IProductFiltersBarProps) {
  const facets = useProductFacets(query, filters);
  const { openSheet } = useSearchSheet();

  const hasFilters = filters.activeFilterCount > 0;

  return (
    <div className="flex w-full items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className="flex-1 bg-white md:hidden"
        onClick={() => openSheet({ filtersExpanded: true })}
      >
        <SlidersHorizontal className="size-4" />
        Filteri
        {hasFilters && <Badge>{filters.activeFilterCount}</Badge>}
      </Button>

      <div className="hidden w-full items-center gap-2 md:flex">
        <ProductFacetSelects facets={facets} filters={filters} layout="row" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!hasFilters}
          className="shrink-0 text-muted-foreground"
          onClick={filters.clearFilters}
        >
          <X className="size-4" />
          Očisti filtere
        </Button>
      </div>
    </div>
  );
}
