"use client";

import { useState, type ComponentProps } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SheetShell from "@/components/custom/modal/sheet-shell";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import ProductFacetSelects from "@/app/products/components/product-facet-selects";
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

  function renderClearFilters(
    className?: string,
    size: ComponentProps<typeof Button>["size"] = "sm",
    alwaysShow = false,
  ) {
    const hasFilters = filters.activeFilterCount > 0;
    if (!hasFilters && !alwaysShow) return null;

    return (
      <Button
        type="button"
        variant="ghost"
        size={size}
        disabled={!hasFilters}
        className={cn("text-muted-foreground", className)}
        onClick={filters.clearFilters}
      >
        <X className="size-4" />
        Očisti filtere
      </Button>
    );
  }

  // A drawer on mobile, so filters neither eat the viewport nor hide in a strip.
  if (isMobile) {
    return (
      <>
        <div className="flex w-full items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 bg-white"
            onClick={() => setIsDrawerOpen(true)}
          >
            <SlidersHorizontal className="size-4" />
            Filteri
            {filters.activeFilterCount > 0 && (
              <Badge>{filters.activeFilterCount}</Badge>
            )}
          </Button>

          {renderClearFilters("flex-1", "default")}
        </div>

        <SheetShell
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          title="Filteri"
          description="Suzi rezultate pretrage po trgovinama, lokacijama, kategorijama i markama."
          headerExtra={renderClearFilters("shrink-0")}
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

      {renderClearFilters("shrink-0", "sm", true)}
    </div>
  );
}
