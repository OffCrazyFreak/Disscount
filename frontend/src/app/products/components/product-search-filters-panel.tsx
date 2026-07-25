"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ClearFiltersButton from "@/app/products/components/clear-filters-button";
import ProductFacetSelects from "@/app/products/components/product-facet-selects";
import ProductFiltersTrigger from "@/app/products/components/product-filters-trigger";
import useProductFacets from "@/app/products/hooks/use-product-facets";
import useProductFilters from "@/app/products/hooks/use-product-filters";

/**
 * The products filters, inline in the search sheet.
 *
 * Expanding grows the sheet upward instead of stacking a second one over it, so
 * the search field you just used stays in view and there is only ever one layer
 * to dismiss.
 */
export default function ProductSearchFiltersPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();

  // The submitted query, not the typed one: these facets describe the results
  // showing behind the sheet.
  const query = searchParams.get("q") ?? "";

  // ProductsClient owns the seeding on this route, so this reader stays out of it.
  const filters = useProductFilters({ seedPreferred: false });
  const facets = useProductFacets(query, filters);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <ProductFiltersTrigger
            count={filters.activeFilterCount}
            expanded={isOpen}
            className="flex-1 py-0"
          />
        </CollapsibleTrigger>

        <ClearFiltersButton filters={filters} className="shrink-0" />
      </div>

      {/* The global class animates the height, so the sheet grows rather than jumps */}
      <CollapsibleContent className="CollapsibleContent my-0">
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
