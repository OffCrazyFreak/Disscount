"use client";

import { useTranslations } from "next-intl";
import SearchActionButton from "@/components/custom/search/search-action-button";
import {
  productSearchDraft,
  useSearchDraftValue,
} from "@/components/custom/search/search-draft-store";
import { useSearchNavigation } from "@/hooks/use-search-navigation";

interface IProductsSheetSubmitProps {
  searchRoute: string;
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
  form,
}: IProductsSheetSubmitProps) {
  const t = useTranslations("products");
  const { routeQuery, isUnchanged } = useSearchNavigation(searchRoute);
  const query = useSearchDraftValue(productSearchDraft, routeQuery);

  return (
    <SearchActionButton
      label={t("productsSheet.submit")}
      block
      form={form}
      isUnchanged={isUnchanged(query)}
    />
  );
}
