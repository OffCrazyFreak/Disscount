"use client";

import type { ReactNode } from "react";
import BottomSheet from "@/components/custom/bottom-sheet/bottom-sheet";
import SearchBar from "@/components/custom/search/search-bar";
import SearchNavButton from "@/components/custom/search/search-nav-button";
import SearchSheetSubmit from "@/components/custom/search/search-sheet-submit";
import { findNavItem } from "@/constants/navigation";
import { useSearchSheet } from "@/context/search-sheet-context";
import { useUser } from "@/context/user-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";

const SEARCH_ROUTE = "/products";

/** Ties the footer's submit button to the field's form, which it sits outside of */
const SEARCH_FORM_ID = "search-sheet-form";

const discountsItem = findNavItem("discounted");

interface ISearchSheetProps {
  /**
   * Products-feature markup, created in the root layout and rendered only once
   * the drawer mounts, so nothing under components/ imports a feature folder and
   * no page is dropped out of the prerender.
   */
  filtersPanel: ReactNode;
}

/**
 * The only non-modal sheet in the app, because it is an addition to the page:
 * what is behind it changes as you act through it. That costs it every outside
 * dismissal, which is why the bar's centre cell is a toggle.
 */
export default function SearchSheet({ filtersPanel }: ISearchSheetProps) {
  const {
    isOpen,
    close,
    fieldRef,
    setQueryDraft,
    areFiltersExpanded,
    setFiltersExpanded,
  } = useSearchSheet();
  const { user } = useUser();

  return (
    <BottomSheet
      open={isOpen}
      onOpenChange={(next) => !next && close()}
      title="Traži proizvode"
      srOnlyTitle
      description="Upiši naziv proizvoda ili skeniraj crtni kod."
      modal={false}
      // Opened for the filters, the field is not what you came for, and focusing
      // it would raise the keyboard over the facets you just asked to see.
      initialFocusRef={areFiltersExpanded ? undefined : fieldRef}
      onDragUp={() => setFiltersExpanded(true)}
      footer={
        <SearchSheetSubmit searchRoute={SEARCH_ROUTE} formId={SEARCH_FORM_ID} />
      }
      className="md:hidden"
    >
      <SearchBar
        searchRoute={SEARCH_ROUTE}
        placeholder="Pretraži proizvode..."
        allowScanning
        submitButtonLocation="none"
        formId={SEARCH_FORM_ID}
        fieldRef={fieldRef}
        onQueryChange={setQueryDraft}
      />

      <SearchNavButton
        item={discountsItem}
        isLocked={
          Boolean(discountsItem.comingSoon) && !isAdmin(user?.accountType)
        }
      />

      {filtersPanel}
    </BottomSheet>
  );
}
