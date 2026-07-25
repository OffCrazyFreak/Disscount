"use client";

import SearchSubmitButton from "@/components/custom/search/search-submit-button";
import { useSearchSheet } from "@/context/search-sheet-context";
import { useSearchNavigation } from "@/hooks/use-search-navigation";

interface ISearchSheetSubmitProps {
  searchRoute: string;
  formId: string;
}

/**
 * Its own file because it reads the URL. Passed as the sheet's footer it is only
 * *created* in the root layout and only rendered once the drawer mounts, so no
 * page in the app is dropped out of the prerender.
 */
export default function SearchSheetSubmit({
  searchRoute,
  formId,
}: ISearchSheetSubmitProps) {
  const { queryDraft } = useSearchSheet();
  const { isUnchanged } = useSearchNavigation(searchRoute);

  return (
    <SearchSubmitButton
      label="Pretraži"
      block
      form={formId}
      disabled={isUnchanged(queryDraft)}
    />
  );
}
