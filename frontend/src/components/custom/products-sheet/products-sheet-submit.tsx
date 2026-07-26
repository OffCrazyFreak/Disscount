"use client";

import SearchActionButton from "@/components/custom/search/search-action-button";
import { useSearchNavigation } from "@/hooks/use-search-navigation";

interface IProductsSheetSubmitProps {
  searchRoute: string;
  /** The live field value, so the button can tell a real search from a no-op */
  query: string;
  /** The form this button owns, which it sits outside of */
  form: string;
}

/**
 * The products sheet's footer button.
 *
 * Its own component because it reads the URL, and `ProductsSheet` is mounted in the
 * root layout: a `useSearchParams` call up there would drop every page out of the
 * prerender. Down here it only runs while the sheet is open.
 */
export default function ProductsSheetSubmit({
  searchRoute,
  query,
  form,
}: IProductsSheetSubmitProps) {
  const { isUnchanged } = useSearchNavigation(searchRoute);

  return (
    <SearchActionButton
      label="Pretraži"
      block
      form={form}
      isUnchanged={isUnchanged(query)}
    />
  );
}
