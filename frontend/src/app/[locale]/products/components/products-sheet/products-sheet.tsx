"use client";

import { usePathname } from "@/i18n/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import ProductSearchBar from "@/components/custom/search/product-search-bar";
import SearchNavButton from "@/components/custom/search/search-nav-button";
import ProductsSheetSubmit from "@/app/[locale]/products/components/products-sheet/products-sheet-submit";
import SheetShell from "@/components/custom/modal/sheet-shell";
import ProductSearchFilters from "@/app/[locale]/products/components/product-search-filters";
import { useProductsSheet } from "@/context/products-sheet-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUser } from "@/context/user-context";
import { findNavItem, isNavItemLocked } from "@/constants/navigation";

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
  const {
    isOpen,
    areFiltersOpen,
    setAreFiltersOpen,
    inputRef,
    triggerRef,
    close,
  } = useProductsSheet();
  const t = useTranslations("products");
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { user } = useUser();

  // Any navigation closes it, so a search never leaves its own results covered.
  useEffect(() => {
    close();
  }, [pathname, close]);

  // md:hidden only hides it. Left open, the bar's toggle state goes stale.
  useEffect(() => {
    if (!isMobile) close();
  }, [isMobile, close]);

  return (
    <SheetShell
      open={isOpen}
      onOpenChange={(next) => !next && close()}
      title={t("productsSheet.title")}
      srOnlyTitle
      description={t("productsSheet.description")}
      // Non-modal: picking a facet re-filters the list behind it live, so it
      // must neither cover the page nor lock it.
      modal={false}
      // Opened for the filters, the field is not what you came for, and focusing
      // it would raise the keyboard over the facets you asked to see.
      initialFocusRef={areFiltersOpen ? undefined : inputRef}
      // The bar's centre cell opened it, so closing puts focus back on it.
      returnFocusRef={triggerRef}
      // Dragging up asks for the whole surface, which is search plus its filters.
      onDragUp={() => setAreFiltersOpen(true)}
      // Last in the sheet and outside the scroll, so expanding the filters cannot
      // push the one action that acts on them out of reach.
      footer={
        <ProductsSheetSubmit
          searchRoute={FILTERED_ROUTE}
          form={PRODUCTS_FORM_ID}
        />
      }
      className="md:hidden"
    >
      <ProductSearchBar
        placeholder={t("list.searchPlaceholder")}
        allowScanning
        submitButtonLocation="none"
        formId={PRODUCTS_FORM_ID}
        inputRef={inputRef}
        onSubmitted={close}
      />

      <SearchNavButton
        item={discountsNavItem}
        isLocked={isNavItemLocked(discountsNavItem, user?.accountType)}
        // A query-string change never trips the pathname effect above, so this
        // has to close the sheet itself or it covers where it just sent you.
        onNavigate={close}
      />

      <ProductSearchFilters
        open={areFiltersOpen}
        onOpenChange={setAreFiltersOpen}
        queryInputRef={inputRef}
      />
    </SheetShell>
  );
}
