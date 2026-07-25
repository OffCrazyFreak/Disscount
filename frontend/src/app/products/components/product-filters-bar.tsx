"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import SheetShell from "@/components/custom/modal/sheet-shell";
import { useIsMobile } from "@/hooks/use-mobile";
import ClearFiltersButton from "@/app/products/components/clear-filters-button";
import ProductFacetSelects from "@/app/products/components/product-facet-selects";
import ProductFiltersTrigger from "@/app/products/components/product-filters-trigger";
import useProductFacets from "@/app/products/hooks/use-product-facets";
import type { IUseProductFiltersResult } from "@/app/products/hooks/use-product-filters";

interface IProductFiltersBarProps {
  filters: IUseProductFiltersResult;
  query: string;
}

export default function ProductFiltersBar({
  filters,
  query,
}: IProductFiltersBarProps) {
  const facets = useProductFacets(query, filters);
  const isMobile = useIsMobile();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // A drawer on mobile, so filters neither eat the viewport nor hide in a strip.
  if (isMobile) {
    return (
      <>
        <div className="flex w-full items-center gap-2">
          <ProductFiltersTrigger
            count={filters.activeFilterCount}
            className="flex-1"
            onClick={() => setIsDrawerOpen(true)}
          />

          <ClearFiltersButton
            filters={filters}
            size="default"
            className="flex-1"
          />
        </div>

        <SheetShell
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          title="Filteri"
          description="Suzi rezultate pretrage po trgovinama, lokacijama, kategorijama i markama."
          headerExtra={
            <ClearFiltersButton filters={filters} className="shrink-0" />
          }
          footer={
            <Button type="button" onClick={() => setIsDrawerOpen(false)}>
              Prikaži rezultate
            </Button>
          }
        >
          <ProductFacetSelects
            facets={facets}
            filters={filters}
            layout="stack"
          />
        </SheetShell>
      </>
    );
  }

  return (
    <div className="flex w-full items-center gap-2">
      <ProductFacetSelects facets={facets} filters={filters} layout="row" />

      <ClearFiltersButton filters={filters} alwaysShow className="shrink-0" />
    </div>
  );
}
