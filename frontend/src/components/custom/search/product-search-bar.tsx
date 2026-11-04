"use client";

import SearchBar, {
  type ISearchBarProps,
} from "@/components/custom/search/search-bar";
import { productSearchDraft } from "@/components/custom/search/search-draft-store";

type IProductSearchBarProps = Omit<
  ISearchBarProps,
  "searchRoute" | "draftStore" | "autoSearch" | "shallow"
>;

/**
 * A product search field. Several can share a screen, each with its own submit
 * button, so they mirror one draft and any of them searches what was typed.
 */
export default function ProductSearchBar(props: IProductSearchBarProps) {
  return (
    <SearchBar
      {...props}
      searchRoute="/products"
      draftStore={productSearchDraft}
    />
  );
}
