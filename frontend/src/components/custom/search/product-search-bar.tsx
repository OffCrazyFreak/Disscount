"use client";

import SearchBar, {
  type ISearchBarProps,
} from "@/components/custom/search/search-bar";
import { productSearchDraft } from "@/components/custom/search/search-draft-store";
import { markProductSearchSubmitted } from "@/components/custom/search/use-record-product-search";

type IProductSearchBarProps = Omit<
  ISearchBarProps,
  "searchRoute" | "draftStore" | "autoSearch" | "shallow" | "suggestions"
>;

/**
 * A product search field. Several can share a screen, each with its own submit
 * button, so they mirror one draft and any of them searches what was typed.
 */
export default function ProductSearchBar({
  onSubmitted,
  ...props
}: IProductSearchBarProps) {
  return (
    <SearchBar
      {...props}
      searchRoute="/products"
      draftStore={productSearchDraft}
      suggestions
      onSubmitted={(query) => {
        markProductSearchSubmitted(query);
        onSubmitted?.(query);
      }}
    />
  );
}
