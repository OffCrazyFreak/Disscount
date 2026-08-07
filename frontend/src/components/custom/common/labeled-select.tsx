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
  /**
   * Id of an element explaining what the choice means. Without it a screen reader user
   * hears only the bare option labels and never the consequence of picking one.
   */
  describedById?: string;
  /**
   * Hides the label visually but keeps it as the trigger's accessible name. For a control
   * that already sits under a visible heading, where repeating it would be noise on screen
   * and the bare options would be meaningless to a screen reader.
   */
  className?: string;
}

/** Leading label and dropdown, shared by every control that narrows or reorders a list. */
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
          // bg-background, not bg-white: the trigger sits on the surface it is placed on,
          // so a hardcoded white stayed white in dark mode.
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
