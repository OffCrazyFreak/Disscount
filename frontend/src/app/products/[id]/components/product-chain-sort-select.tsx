"use client";

import LabeledSelect from "@/components/custom/common/labeled-select";
import type { ILabeledSelectOption } from "@/typings/labeled-select-option";
import type { ProductChainSortMode } from "@/app/products/utils/product-chain-sort";

const SORT_OPTIONS: ILabeledSelectOption<ProductChainSortMode>[] = [
  { value: "stores", label: "Trgovinama" },
  { value: "price", label: "Cijeni" },
  { value: "distance", label: "Udaljenosti", comingSoon: true },
];

interface IProductChainSortSelectProps {
  value: ProductChainSortMode;
  onValueChange: (mode: ProductChainSortMode) => void;
}

/** Picks how the chains carrying one product are ordered. */
export default function ProductChainSortSelect({
  value,
  onValueChange,
}: IProductChainSortSelectProps) {
  return (
    <LabeledSelect
      label="Optimiziraj po:"
      value={value}
      onValueChange={onValueChange}
      options={SORT_OPTIONS}
    />
  );
}
