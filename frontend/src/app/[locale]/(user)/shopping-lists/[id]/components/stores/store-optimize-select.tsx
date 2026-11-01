import { useTranslations } from "next-intl";
import LabeledSelect from "@/components/custom/common/labeled-select";
import type { ILabeledSelectOption } from "@/typings/labeled-select-option";
import type { StoreOptimizeMode } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-utils";

const OPTIMIZE_OPTIONS = [
  { value: "products", labelKey: "stores.optimize.products" },
  { value: "basket", labelKey: "stores.optimize.basket" },
  { value: "total", labelKey: "stores.optimize.total" },
  { value: "distance", labelKey: "stores.optimize.distance" },
] as const satisfies readonly {
  value: StoreOptimizeMode;
  labelKey: string;
}[];

interface IStoreOptimizeSelectProps {
  value: StoreOptimizeMode;
  onValueChange: (mode: StoreOptimizeMode) => void;
  describedById?: string;
}

export default function StoreOptimizeSelect({
  value,
  onValueChange,
  describedById,
}: IStoreOptimizeSelectProps) {
  const t = useTranslations("shoppingListDetail");

  const options: ILabeledSelectOption<StoreOptimizeMode>[] =
    OPTIMIZE_OPTIONS.map((option) => ({
      value: option.value,
      label: t(option.labelKey),
    }));

  return (
    <LabeledSelect
      label={t("stores.optimizeBy")}
      value={value}
      onValueChange={onValueChange}
      options={options}
      describedById={describedById}
    />
  );
}
