"use client";

import { useTranslations } from "next-intl";
import LabeledSelect from "@/components/custom/common/labeled-select";
import type { ILabeledSelectOption } from "@/typings/labeled-select-option";
import type { ProductChainSortMode } from "@/app/[locale]/products/utils/product-chain-sort";

const SORT_OPTIONS = [
  { value: "stores", labelKey: "stores" },
  { value: "price", labelKey: "price" },
  { value: "distance", labelKey: "distance", comingSoon: true },
] as const;

interface IProductChainSortSelectProps {
  value: ProductChainSortMode;
  onValueChange: (mode: ProductChainSortMode) => void;
}

/** Picks how the chains carrying one product are ordered. */
export default function ProductChainSortSelect({
  value,
  onValueChange,
}: IProductChainSortSelectProps) {
  const t = useTranslations("productDetail.sort");

  const options: ILabeledSelectOption<ProductChainSortMode>[] =
    SORT_OPTIONS.map((option) => ({
      value: option.value,
      label: t(option.labelKey),
      ...("comingSoon" in option ? { comingSoon: option.comingSoon } : {}),
    }));

  return (
    <LabeledSelect
      label={t("label")}
      value={value}
      onValueChange={onValueChange}
      options={options}
    />
  );
}
