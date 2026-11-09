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
  form: string;
}

/** Its own component because `useSearchParams` in the root layout would break prerendering for every page. */
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
