"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SearchBar from "@/components/custom/search/search-bar";
import SheetShell from "@/components/custom/modal/sheet-shell";
import ProductSearchFilters from "@/app/products/components/product-search-filters";
import { useSearchSheet } from "@/context/search-sheet-context";

/** The one route whose filters live in the sheet, so it survives arriving there */
const FILTERED_ROUTE = "/products";

/**
 * Mobile search, opened by the bottom nav's centre tab.
 *
 * Runs behind the bar with no scrim, so the nav stays visible and the sheet reads
 * as an extension of it rather than a layer over the app.
 */
export default function SearchSheet() {
  const { isOpen, inputRef, close } = useSearchSheet();
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);
  const pathname = usePathname();

  // Leaving closes it, matching the sidebar, except on the route whose filters it
  // carries: dismissing there would hide the controls it just revealed.
  useEffect(() => {
    if (pathname !== FILTERED_ROUTE) close();
  }, [pathname, close]);

  return (
    <SheetShell
      open={isOpen}
      onOpenChange={(next) => !next && close()}
      title="Traži proizvode"
      srOnlyTitle
      description="Upiši naziv proizvoda ili skeniraj crtni kod."
      initialFocusRef={inputRef}
      // Dragging up asks for the whole surface, which is search plus its filters.
      onDragUp={() => setAreFiltersOpen(true)}
      className="md:hidden"
    >
      <SearchBar
        searchRoute={FILTERED_ROUTE}
        placeholder="Pretraži proizvode..."
        allowScanning
        submitButtonLocation="block"
        submitLabel="Pretraži"
        inputRef={inputRef}
      />

      <ProductSearchFilters
        open={areFiltersOpen}
        onOpenChange={setAreFiltersOpen}
        queryInputRef={inputRef}
      />
    </SheetShell>
  );
}
