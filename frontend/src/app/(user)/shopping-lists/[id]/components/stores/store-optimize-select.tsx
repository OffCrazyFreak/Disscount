import LabeledSelect from "@/components/custom/common/labeled-select";
import type { ILabeledSelectOption } from "@/typings/labeled-select-option";
import type { StoreOptimizeMode } from "@/app/(user)/shopping-lists/utils/shopping-list-utils";

const OPTIMIZE_OPTIONS: ILabeledSelectOption<StoreOptimizeMode>[] = [
  { value: "products", label: "Broj proizvoda" },
  { value: "basket", label: "Najjeftinija košarica" },
  { value: "total", label: "Zasebnim proizvodima" },
  { value: "distance", label: "Udaljenost", comingSoon: true },
];

interface IStoreOptimizeSelectProps {
  value: StoreOptimizeMode;
  onValueChange: (mode: StoreOptimizeMode) => void;
}

/** Picks which store chains lead the list for a shopping list. */
export default function StoreOptimizeSelect({
  value,
  onValueChange,
}: IStoreOptimizeSelectProps) {
  return (
    <LabeledSelect
      label="Optimiziraj po:"
      value={value}
      onValueChange={onValueChange}
      options={OPTIMIZE_OPTIONS}
    />
  );
}
