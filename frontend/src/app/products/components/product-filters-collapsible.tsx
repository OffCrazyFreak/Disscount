"use client";

import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import ClearFiltersButton from "@/app/products/components/clear-filters-button";
import ProductFacetSelects from "@/app/products/components/product-facet-selects";
import ProductFiltersTrigger from "@/app/products/components/product-filters-trigger";
import { useSearchSheet } from "@/context/search-sheet-context";
import type { IProductFacetSelects } from "@/app/products/hooks/use-product-facets";
import type { IUseProductFiltersResult } from "@/app/products/hooks/use-product-filters";

interface IProductFiltersCollapsibleProps {
  facets: IProductFacetSelects;
  filters: IUseProductFiltersResult;
}

/**
 * Grows the sheet in place rather than stacking a second sheet over it, so the
 * query you typed stays in view and there is only ever one layer to dismiss.
 */
export default function ProductFiltersCollapsible({
  facets,
  filters,
}: IProductFiltersCollapsibleProps) {
  const { areFiltersExpanded, setFiltersExpanded } = useSearchSheet();

  return (
    <Collapsible open={areFiltersExpanded}>
      <div className="flex items-center gap-2">
        <ProductFiltersTrigger
          count={filters.activeFilterCount}
          expanded={areFiltersExpanded}
          className="flex-1"
          onClick={() => setFiltersExpanded(!areFiltersExpanded)}
        />

        <ClearFiltersButton filters={filters} />
      </div>

      <CollapsibleContent className="CollapsibleContent">
        <div className="flex flex-col gap-3 pt-3">
          <ProductFacetSelects
            facets={facets}
            filters={filters}
            layout="stack"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
