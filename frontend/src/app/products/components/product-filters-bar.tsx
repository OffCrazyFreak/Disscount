"use client";

import { useState, type ComponentProps } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import ProductFacetSelects from "@/app/products/components/product-facet-selects";
import useProductFacets from "@/app/products/hooks/useProductFacets";
import type { IUseProductFiltersResult } from "@/app/products/hooks/useProductFilters";

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
  ) {
    if (filters.activeFilterCount === 0) return null;

    return (
      <Button
        type="button"
        variant="ghost"
        size={size}
        className={cn("text-muted-foreground", className)}
        onClick={filters.clearFilters}
      >
        <X className="size-4" />
        Očisti filtere
      </Button>
    );
  }

  // Mobile: one full-width trigger opening a swipeable drawer, so the filters
  // don't eat the viewport or hide in a horizontal scroll strip.
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
              <Badge className="ml-1 size-5 justify-center rounded-full p-0 text-xs">
                {filters.activeFilterCount}
              </Badge>
            )}
          </Button>

          {renderClearFilters("flex-1", "default")}
        </div>

        <Drawer
          direction="bottom"
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
        >
          <DrawerContent className="max-h-[85dvh]">
            <div className="flex items-center justify-between gap-2 px-4 pt-2 pb-3">
              <DrawerTitle className="text-lg">Filteri</DrawerTitle>
              <DrawerDescription className="sr-only">
                Suzi rezultate pretrage po trgovinama, lokacijama, kategorijama
                i brendovima.
              </DrawerDescription>

              {renderClearFilters("shrink-0")}
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-2">
              <ProductFacetSelects
                facets={facets}
                filters={filters}
                layout="stack"
              />
            </div>

            <DrawerFooter className="px-4 pt-3 pb-4">
              <Button type="button" onClick={() => setIsDrawerOpen(false)}>
                Prikaži rezultate
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ProductFacetSelects facets={facets} filters={filters} layout="row" />

      {renderClearFilters("shrink-0")}
    </div>
  );
}
