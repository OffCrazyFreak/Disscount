"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";
import BottomSheet from "@/components/custom/bottom-sheet/bottom-sheet";
import SearchSheetBody from "@/components/custom/search-sheet/search-sheet-body";
import { Button } from "@/components/ui/button";
import { useSearchSheet } from "@/context/search-sheet-context";

export const SEARCH_SHEET_FORM_ID = "search-sheet-form";

/**
 * Non-modal, because picking a facet re-filters the list behind it live, so it
 * must neither cover the page nor lock it. The centre cell's toggle is the only
 * way to close it from the bar: the primitives veto outside-press and
 * focus-outside dismissal when a sheet is non-modal.
 */
export default function SearchSheet() {
  const { isOpen, filtersExpanded, closeSheet, setFiltersExpanded } =
    useSearchSheet();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  if (isOpen && !hasOpened) setHasOpened(true);

  // Nothing inside reads the URL until the sheet has opened once, so mounting it
  // in the layout cannot drop the app's pages out of the prerender. It stays
  // mounted afterwards, so the closing animation still plays.
  if (!hasOpened) return null;

  return (
    <BottomSheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeSheet();
      }}
      modal={false}
      title="Traži proizvode"
      description="Upiši naziv proizvoda ili skeniraj crtni kod."
      srOnlyDescription={false}
      // Declined when opened straight into the filters, since the keyboard would
      // cover the facets the user just asked to see.
      initialFocusRef={filtersExpanded ? undefined : inputRef}
      // Mid-drag, so the sheet grows under the finger that asked for it.
      onDragUp={() => setFiltersExpanded(true)}
      footer={
        <Button
          type="submit"
          form={SEARCH_SHEET_FORM_ID}
          size="lg"
          className="w-full"
          disabled={!canSubmit}
        >
          <Search className="size-5" />
          Pretraži
        </Button>
      }
    >
      <SearchSheetBody
        formId={SEARCH_SHEET_FORM_ID}
        inputRef={inputRef}
        onCanSubmitChange={setCanSubmit}
      />
    </BottomSheet>
  );
}
