"use client";

import { type RefObject } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import type { ProductFilterKey } from "@/app/products/hooks/use-filter-params";

/** Where these filters mean something, and so where they are always written */
const PRODUCTS_ROUTE = "/products";

interface IProductSearchFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Read at pick time, so a half-typed query survives the trip to /products */
  queryInputRef: RefObject<HTMLInputElement | null>;
}

/**
 * The products filters, inline in the products sheet on every route.
 *
 * Expanding grows the sheet upward instead of stacking a second one over it, so
 * the search field you just used stays in view and there is only ever one layer
 * to dismiss.
 */
export default function ProductSearchFilters({
  open,
  onOpenChange,
  queryInputRef,
}: IProductSearchFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isOnProducts = pathname === PRODUCTS_ROUTE;

  // Facets describe a submitted products search, which only exists on that route.
  const query = isOnProducts ? (searchParams.get("q") ?? "") : "";

  // ProductsClient owns the seeding on that route, so this reader stays out of it.
  const filters = useProductFilters({ seedPreferred: false });
  const facets = useProductFacets(query, filters);

  // Off the route the URL holds no filters to amend, so the pick and whatever is
  // typed travel together in one navigation rather than editing the page we leave.
  function pickAndNavigate(key: ProductFilterKey, values: string[]) {
    const params = new URLSearchParams();
    const typed = queryInputRef.current?.value.trim();

    if (typed) params.set("q", typed);
    values.forEach((value) => params.append(key, value));

    router.push(`${PRODUCTS_ROUTE}?${params.toString()}`);
  }

  const routedFilters = isOnProducts
    ? filters
    : { ...filters, setFilter: pickAndNavigate };

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <ProductFiltersTrigger
            count={filters.activeFilterCount}
            expanded={open}
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
            filters={routedFilters}
            layout="stack"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
