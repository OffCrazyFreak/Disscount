"use client";

import LabeledSelect from "@/components/custom/common/labeled-select";
import {
  CARD_SORT_LABELS,
  CARD_SORT_MODES,
  type CardSortMode,
} from "@/app/(user)/digital-cards/utils/card-sorting";

interface IDigitalCardsSortSelectProps {
  value: CardSortMode;
  onValueChange: (value: CardSortMode) => void;
  disabled?: boolean;
}

const OPTIONS = CARD_SORT_MODES.map((value) => ({
  value,
  label: CARD_SORT_LABELS[value],
}));

export default function DigitalCardsSortSelect({
  value,
  onValueChange,
  disabled,
}: IDigitalCardsSortSelectProps) {
  return (
    <LabeledSelect
      label="Sortiraj"
      value={value}
      onValueChange={onValueChange}
      options={OPTIONS}
      disabled={disabled}
    />
  );
}
