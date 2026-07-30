"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { FormDescription, FormLabel, FormMessage } from "@/components/ui/form";
import type { DigitalCardFormData } from "@/lib/api/types";
import ColorPickerHoneycomb from "@/app/(user)/digital-cards/components/forms/color-picker/color-picker-honeycomb";
import ColorPickerSwatchSlider from "@/app/(user)/digital-cards/components/forms/color-picker/color-picker-swatch-slider";
import ColorPickerSwatches from "@/app/(user)/digital-cards/components/forms/color-picker/color-picker-swatches";
import ColorPickerSwitcher, {
  type ColorPickerVariant,
} from "@/app/(user)/digital-cards/components/forms/color-picker/color-picker-switcher";

interface ICardColorFieldProps {
  /** True once the user picks a colour, after which nothing auto-fills over them. */
  isCustomized: boolean;
  onCustomize: () => void;
}

export default function CardColorField({
  isCustomized,
  onCustomize,
}: ICardColorFieldProps) {
  const form = useFormContext<DigitalCardFormData>();
  const [variant, setVariant] = useState<ColorPickerVariant>("swatch-slider");

  const value = form.watch("cardColor");

  function handleChange(hex: string) {
    form.setValue("cardColor", hex, {
      shouldDirty: true,
      shouldValidate: true,
    });
    onCustomize();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FormLabel htmlFor={undefined}>Boja kartice</FormLabel>
        <ColorPickerSwitcher value={variant} onChange={setVariant} />
      </div>

      {variant === "swatch-slider" && (
        <ColorPickerSwatchSlider value={value} onChange={handleChange} />
      )}
      {variant === "honeycomb" && (
        <ColorPickerHoneycomb value={value} onChange={handleChange} />
      )}
      {variant === "swatches" && (
        <ColorPickerSwatches value={value} onChange={handleChange} />
      )}

      <FormDescription>
        {isCustomized
          ? "Boja pomaže da karticu prepoznaš na prvi pogled."
          : "Boju predlažemo iz trgovine ili slike, a možeš je promijeniti."}
      </FormDescription>

      <FormMessage />
    </div>
  );
}
