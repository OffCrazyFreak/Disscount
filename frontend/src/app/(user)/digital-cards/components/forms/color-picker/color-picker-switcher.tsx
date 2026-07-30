"use client";

import { cn } from "@/lib/utils";

export const COLOR_PICKER_VARIANTS = [
  { id: "swatch-slider", label: "Paleta i nijansa" },
  { id: "honeycomb", label: "Šesterokuti" },
  { id: "swatches", label: "Samo paleta" },
] as const;

export type ColorPickerVariant = (typeof COLOR_PICKER_VARIANTS)[number]["id"];

interface IColorPickerSwitcherProps {
  value: ColorPickerVariant;
  onChange: (variant: ColorPickerVariant) => void;
}

/**
 * TODO(digital-cards): temporary. Three pickers ship side by side so the final one can be
 * chosen from real use; delete this switcher and the two losing variants once it is picked.
 */
export default function ColorPickerSwitcher({
  value,
  onChange,
}: IColorPickerSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md bg-muted p-1">
      {COLOR_PICKER_VARIANTS.map((variant) => (
        <button
          key={variant.id}
          type="button"
          aria-pressed={value === variant.id}
          onClick={() => onChange(variant.id)}
          className={cn(
            "cursor-pointer rounded-sm px-2 py-1 text-xs transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            value === variant.id
              ? "bg-background font-medium shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {variant.label}
        </button>
      ))}
    </div>
  );
}
