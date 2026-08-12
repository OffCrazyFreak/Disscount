"use client";

import { hslToHex } from "@/app/(user)/digital-cards/utils/card-colors";
import { NEUTRAL_CARD_COLORS } from "@/app/(user)/digital-cards/utils/card-colors";
import { cn } from "@/lib/utils";

interface IColorPickerHoneycombProps {
  value: string;
  onChange: (hex: string) => void;
}

// Three rings of hues, saturation easing outward so the middle reads as the calm choice and
// the rim as the bold one. Row lengths are what give the comb its stagger.
const ROWS: { saturation: number; lightness: number; count: number }[] = [
  { saturation: 38, lightness: 50, count: 7 },
  { saturation: 62, lightness: 42, count: 8 },
  { saturation: 78, lightness: 34, count: 7 },
];

const HEX_CLIP =
  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

/**
 * Variant B: a honeycomb. Hexagons tessellate without gaps, so the palette reads as one
 * surface rather than a grid of dots, and the shape itself is the memorable part.
 */
export default function ColorPickerHoneycomb({
  value,
  onChange,
}: IColorPickerHoneycombProps) {
  const selected = value.toLowerCase();

  return (
    <div
      role="radiogroup"
      aria-label="Boja kartice"
      className="flex flex-col items-center gap-1"
    >
      {ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-1"
          // Offset every other row by half a cell, which is what makes it a comb.
          style={{ marginLeft: rowIndex % 2 === 1 ? "1.15rem" : undefined }}
        >
          {Array.from({ length: row.count }, (_, cellIndex) => {
            const hue = Math.round((360 / row.count) * cellIndex);
            const hex = hslToHex(hue, row.saturation, row.lightness);
            const isSelected = hex.toLowerCase() === selected;

            return (
              <button
                key={hex}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`Boja ${hex}`}
                onClick={() => onChange(hex)}
                style={{ backgroundColor: hex, clipPath: HEX_CLIP }}
                className={cn(
                  "size-9 cursor-pointer transition focus-visible:outline-none",
                  isSelected
                    ? "scale-110 ring-2 ring-foreground"
                    : "hover:scale-105 focus-visible:scale-110",
                )}
              />
            );
          })}
        </div>
      ))}

      <div className="mt-1 flex gap-1">
        {NEUTRAL_CARD_COLORS.map((hex) => {
          const isSelected = hex.toLowerCase() === selected;

          return (
            <button
              key={hex}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Boja ${hex}`}
              onClick={() => onChange(hex)}
              style={{ backgroundColor: hex, clipPath: HEX_CLIP }}
              className={cn(
                "size-9 cursor-pointer transition focus-visible:outline-none",
                isSelected
                  ? "scale-110 ring-2 ring-foreground"
                  : "hover:scale-105 focus-visible:scale-110",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
