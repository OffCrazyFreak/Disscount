"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SearchBar from "@/components/custom/search/search-bar";
import SearchNavButton from "@/components/custom/search/search-nav-button";
import ProductsSheetSubmit from "@/components/custom/products-sheet/products-sheet-submit";
import SheetShell from "@/components/custom/modal/sheet-shell";
import ProductSearchFilters from "@/app/products/components/product-search-filters";
import { useProductsSheet } from "@/context/products-sheet-context";
import { useUser } from "@/context/user-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";
import { findNavItem } from "@/constants/navigation";

/** The one route whose filters live in the sheet, so it survives arriving there */
const FILTERED_ROUTE = "/products";

/** Ties the footer's submit button to the field's form, which it sits outside of */
const PRODUCTS_FORM_ID = "products-sheet-form";

const discountsNavItem = findNavItem("discounted");

/**
 * Mobile search, opened by the bottom nav's centre tab and by the products page's
 * Filteri button, which lands on it already expanded.
 *
 * Runs behind the bar with no scrim, so the nav stays visible and the sheet reads
 * as an extension of it rather than a layer over the app.
 */
export default function ProductsSheet() {
  const { isOpen, areFiltersOpen, setAreFiltersOpen, inputRef, close } =
    useProductsSheet();
  const [typedQuery, setTypedQuery] = useState("");
  const pathname = usePathname();
  const { user } = useUser();

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
      // The one non-modal sheet: picking a facet re-filters the list behind it
      // live, so it must neither cover the page nor lock it.
      modal={false}
      // Opened for the filters, the field is not what you came for, and focusing
      // it would raise the keyboard over the facets you asked to see.
      initialFocusRef={areFiltersOpen ? undefined : inputRef}
      // Dragging up asks for the whole surface, which is search plus its filters.
      onDragUp={() => setAreFiltersOpen(true)}
      // Last in the sheet and outside the scroll, so expanding the filters cannot
      // push the one action that acts on them out of reach.
      footer={
        <ProductsSheetSubmit
          searchRoute={FILTERED_ROUTE}
          query={typedQuery}
          form={PRODUCTS_FORM_ID}
        />
      }
      className="md:hidden"
    >
      <SearchBar
        searchRoute={FILTERED_ROUTE}
        placeholder="Pretraži proizvode..."
        allowScanning
        submitButtonLocation="none"
        formId={PRODUCTS_FORM_ID}
        inputRef={inputRef}
        onQueryChange={setTypedQuery}
      />

      <SearchNavButton
        item={discountsNavItem}
        isLocked={
          Boolean(discountsNavItem.comingSoon) && !isAdmin(user?.accountType)
        }
      />

      <ProductSearchFilters
        open={areFiltersOpen}
        onOpenChange={setAreFiltersOpen}
        queryInputRef={inputRef}
      />
    </SheetShell>
  );
}
