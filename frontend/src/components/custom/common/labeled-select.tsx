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
import { cn } from "@/lib/utils";
import type { ILabeledSelectOption } from "@/typings/labeled-select-option";

interface ILabeledSelectProps<TValue extends string> {
  label: string;
  value: TValue;
  onValueChange: (value: TValue) => void;
  options: readonly ILabeledSelectOption<TValue>[];
  className?: string;
}

/** Leading label and dropdown, shared by every control that narrows or reorders a list. */
export default function LabeledSelect<TValue extends string>({
  label,
  value,
  onValueChange,
  options,
  className,
}: ILabeledSelectProps<TValue>) {
  const labelId = useId();

  return (
    <div
      className={cn("flex flex-wrap items-center justify-end gap-2", className)}
    >
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
        <SelectTrigger
          aria-labelledby={labelId}
          size="sm"
          className="w-full bg-white sm:w-60"
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
