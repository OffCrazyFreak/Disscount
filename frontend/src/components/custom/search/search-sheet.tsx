"use client";

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

/**
 * The only non-modal sheet in the app, because it is an addition to the page:
 * what is behind it changes as you act through it. That costs it every outside
 * dismissal, which is why the bar's centre cell is a toggle.
 */
export default function SearchSheet() {
  const { isOpen, close, fieldRef, setQueryDraft } = useSearchSheet();
  const { user } = useUser();

  return (
    <BottomSheet
      open={isOpen}
      onOpenChange={(next) => !next && close()}
      title="Traži proizvode"
      srOnlyTitle
      description="Upiši naziv proizvoda ili skeniraj crtni kod."
      modal={false}
      initialFocusRef={fieldRef}
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
    </BottomSheet>
  );
}
