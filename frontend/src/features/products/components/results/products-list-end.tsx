"use client";

import { useTranslations } from "next-intl";

import AddPlainItemButton from "@/features/products/components/results/add-plain-item-button";

interface IProductsListEndProps {
  query: string;
  shownCount: number;
  total: number;
  isRefreshing: boolean;
}

/** For a list whose results are close but not right. */
export default function ProductsListEnd({
  query,
  shownCount,
  total,
  isRefreshing,
}: IProductsListEndProps) {
  const t = useTranslations("products");

  // Only once every batch is revealed, or the offer would jump down as the next one loads.
  if (isRefreshing || shownCount < total || !query.trim()) return null;

  return (
    <div className="flex flex-col items-center gap-3 pt-8 text-center">
      <p className="text-muted-foreground">{t("list.endOfResultsAddPlain")}</p>

      <AddPlainItemButton query={query} variant="outline" />
    </div>
  );
}
