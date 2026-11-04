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
  disabled?: boolean;
  /** Without it a screen reader user hears only the bare option labels and never the consequence of picking one. */
  describedById?: string;
  /** Hides the label visually but keeps its accessible name, for a control already under a visible heading. */
  className?: string;
}

export default function LabeledSelect<TValue extends string>({
  label,
  value,
  onValueChange,
  options,
  disabled = false,
  describedById,
  className,
}: ILabeledSelectProps<TValue>) {
  const labelId = useId();

  return (
    <div
      className={cn("flex flex-wrap items-center justify-end gap-2", className)}
    >
      <span
        id={labelId}
        className={cn("shrink-0 text-sm text-muted-foreground")}
      >
        {label}
      </span>

      <Select
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          const selected = options.find((option) => option.value === next);
          if (selected) onValueChange(selected.value);
        }}
      >
        <SelectTrigger
          aria-labelledby={labelId}
          aria-describedby={describedById}
          // bg-background because the trigger sits on the surface it is placed on, and hardcoded white stayed white in dark mode.
          className="w-full bg-background sm:w-60"
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
