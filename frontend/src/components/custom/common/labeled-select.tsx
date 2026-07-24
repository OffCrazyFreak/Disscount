"use client";

import { useId } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import type { ILabeledSelectOption } from "@/typings/labeled-select-option";

interface ILabeledSelectProps<TValue extends string> {
  label: string;
  value: TValue;
  onValueChange: (value: TValue) => void;
  options: readonly ILabeledSelectOption<TValue>[];
}

/** Leading label and dropdown, shared by every control that narrows or reorders a list. */
export default function LabeledSelect<TValue extends string>({
  label,
  value,
  onValueChange,
  options,
}: ILabeledSelectProps<TValue>) {
  const labelId = useId();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span id={labelId} className="shrink-0 text-sm text-muted-foreground">
        {label}
      </span>

      <Select
        value={value}
        onValueChange={(next) => {
          const selected = options.find((option) => option.value === next);
          if (selected) onValueChange(selected.value);
        }}
      >
        {/* The trigger keeps the primitive's w-fit so its label never clips, and
            min-h beats the primitive's own height where a plain h- utility loses. */}
        <SelectTrigger
          aria-labelledby={labelId}
          className="min-h-10 min-w-52 bg-white"
        >
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.comingSoon}
            >
              {option.comingSoon ? (
                <span className="flex items-center gap-2">
                  {option.label}
                  <ComingSoonBadge />
                </span>
              ) : (
                option.label
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
