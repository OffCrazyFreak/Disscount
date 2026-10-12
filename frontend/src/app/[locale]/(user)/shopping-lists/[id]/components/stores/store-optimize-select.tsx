import { useTranslations } from "next-intl";
import LabeledSelect from "@/components/custom/common/labeled-select";
import type { ILabeledSelectOption } from "@/typings/labeled-select-option";
import type { StoreOptimizeMode } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-utils";

const OPTIMIZE_OPTIONS = [
  { value: "products", labelKey: "stores.optimize.products" },
  { value: "basket", labelKey: "stores.optimize.basket" },
  { value: "total", labelKey: "stores.optimize.total" },
  { value: "distance", labelKey: "stores.optimize.distance", comingSoon: true },
] as const satisfies readonly {
  value: StoreOptimizeMode;
  labelKey: string;
  comingSoon?: boolean;
}[];

interface IStoreOptimizeSelectProps {
  value: StoreOptimizeMode;
  onValueChange: (mode: StoreOptimizeMode) => void;
}

export default function StoreOptimizeSelect({
  value,
  onValueChange,
}: IStoreOptimizeSelectProps) {
  const t = useTranslations("shoppingListDetail");

  const options: ILabeledSelectOption<StoreOptimizeMode>[] =
    OPTIMIZE_OPTIONS.map((option) => ({
      value: option.value,
      label: t(option.labelKey),
      ...("comingSoon" in option ? { comingSoon: option.comingSoon } : {}),
    }));

  return (
    <LabeledSelect
      label={t("stores.optimizeBy")}
      value={value}
      onValueChange={onValueChange}
      options={options}
    />
  );
}
