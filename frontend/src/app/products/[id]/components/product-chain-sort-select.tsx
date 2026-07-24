"use client";

import SortSelect, {
  type ISortSelectOption,
} from "@/components/custom/common/sort-select";
import type { ProductChainSortMode } from "@/app/products/utils/product-chain-sort";

const SORT_OPTIONS: ISortSelectOption[] = [
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
    <SortSelect
      label="Optimiziraj po:"
      value={value}
      onValueChange={onValueChange}
      options={SORT_OPTIONS}
    />
  );
}
