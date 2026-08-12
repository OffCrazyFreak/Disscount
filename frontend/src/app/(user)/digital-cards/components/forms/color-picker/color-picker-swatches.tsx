"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { CARD_SWATCHES } from "@/app/(user)/digital-cards/utils/card-colors";

interface IColorPickerSwatchesProps {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}

/** Variant C, the control condition: swatches only, nothing else to learn. */
export default function ColorPickerSwatches({
  value,
  onChange,
  className,
}: IColorPickerSwatchesProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Boja kartice"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {CARD_SWATCHES.map((hex) => {
        const isSelected = hex.toLowerCase() === value.toLowerCase();

        return (
          <button
            key={hex}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`Boja ${hex}`}
            onClick={() => onChange(hex)}
            style={{ backgroundColor: hex }}
            className={cn(
              "grid size-8 cursor-pointer place-items-center rounded-full text-white shadow-sm ring-1 ring-black/10 transition",
              "hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
              isSelected && "ring-2 ring-foreground ring-offset-2",
            )}
          >
            {isSelected && <Check aria-hidden="true" className="size-4" />}
          </button>
        );
      })}
    </div>
  );
}
