"use client";

import SearchSubmitButton from "@/components/custom/search/search-submit-button";
import { useSearchNavigation } from "@/hooks/use-search-navigation";

interface ISearchSheetSubmitProps {
  searchRoute: string;
  /** The live field value, so the button can tell a real search from a no-op */
  query: string;
  /** The form this button owns, which it sits outside of */
  form: string;
}

/**
 * The search sheet's footer button.
 *
 * Its own component because it reads the URL, and `SearchSheet` is mounted in the
 * root layout: a `useSearchParams` call up there would drop every page out of the
 * prerender. Down here it only runs while the sheet is open.
 */
export default function SearchSheetSubmit({
  searchRoute,
  query,
  form,
}: ISearchSheetSubmitProps) {
  const { isUnchanged } = useSearchNavigation(searchRoute);

  return (
    <SearchSubmitButton
      label="Pretraži"
      block
      form={form}
      disabled={isUnchanged(query)}
    />
  );
}
