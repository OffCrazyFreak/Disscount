"use client";

import { useTranslations } from "next-intl";

import LabeledSelect from "@/components/custom/common/labeled-select";
import {
  CARD_SORT_MODES,
  type CardSortMode,
} from "@/app/[locale]/(user)/digital-cards/utils/card-sorting";

interface IDigitalCardsSortSelectProps {
  value: CardSortMode;
  onChange: (mode: CardSortMode) => void;
}

export default function DigitalCardsSortSelect({
  value,
  onChange,
}: IDigitalCardsSortSelectProps) {
  const t = useTranslations("digitalCards");
  const options = CARD_SORT_MODES.map((mode) => ({
    value: mode,
    label: t(`sort.mode.${mode}`),
  }));

  return (
    <LabeledSelect
      label={t("sort.label")}
      value={value}
      onValueChange={onChange}
      options={options}
    />
  );
}
