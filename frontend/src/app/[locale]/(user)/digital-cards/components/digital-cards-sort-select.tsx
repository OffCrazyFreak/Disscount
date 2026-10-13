"use client";

import LabeledSelect from "@/components/custom/common/labeled-select";
import {
  CARD_SORT_LABELS,
  CARD_SORT_MODES,
  type CardSortMode,
} from "@/app/[locale]/(user)/digital-cards/utils/card-sorting";

interface IDigitalCardsSortSelectProps {
  value: CardSortMode;
  onChange: (mode: CardSortMode) => void;
}

const OPTIONS = CARD_SORT_MODES.map((mode) => ({
  value: mode,
  label: CARD_SORT_LABELS[mode],
}));

export default function DigitalCardsSortSelect({
  value,
  onChange,
}: IDigitalCardsSortSelectProps) {
  return (
    <LabeledSelect
      label="Poredak"
      value={value}
      onValueChange={onChange}
      options={OPTIONS}
    />
  );
}
