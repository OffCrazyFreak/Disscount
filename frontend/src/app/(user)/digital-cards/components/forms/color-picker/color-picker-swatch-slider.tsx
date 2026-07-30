"use client";

import ColorPickerSwatches from "@/app/(user)/digital-cards/components/forms/color-picker/color-picker-swatches";
import HueSlider from "@/app/(user)/digital-cards/components/forms/color-picker/hue-slider";

interface IColorPickerSwatchSliderProps {
  value: string;
  onChange: (hex: string) => void;
}

/**
 * Variant A: one tap for the common case, one drag for anything in between. The swatches
 * and the slider are the same scale, so tapping a swatch simply moves the handle.
 */
export default function ColorPickerSwatchSlider({
  value,
  onChange,
}: IColorPickerSwatchSliderProps) {
  return (
    <div className="space-y-3">
      <ColorPickerSwatches value={value} onChange={onChange} />
      <HueSlider value={value} onChange={onChange} />
    </div>
  );
}
