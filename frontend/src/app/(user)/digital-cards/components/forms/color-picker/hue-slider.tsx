"use client";

import {
  hexForHue,
  hueFromHex,
} from "@/app/(user)/digital-cards/utils/card-colors";

interface IHueSliderProps {
  value: string;
  onChange: (hex: string) => void;
}

const HUE_STOPS = [0, 60, 120, 180, 240, 300, 360]
  .map((hue) => `${hexForHue(hue)} ${(hue / 360) * 100}%`)
  .join(", ");

/**
 * A hue slider rather than a 2D area: saturation and lightness stay locked, so every colour
 * it can produce is legible under white text, and one horizontal drag is the friendliest
 * possible touch target.
 */
export default function HueSlider({ value, onChange }: IHueSliderProps) {
  const { hue, isNeutral } = hueFromHex(value);

  return (
    <label className="block">
      <span className="sr-only">Nijansa boje kartice</span>
      <input
        type="range"
        min={0}
        max={359}
        step={1}
        value={isNeutral ? 0 : hue}
        onChange={(event) => onChange(hexForHue(Number(event.target.value)))}
        className="h-6 w-full cursor-pointer appearance-none rounded-full border border-black/10 outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
        style={{ background: `linear-gradient(90deg, ${HUE_STOPS})` }}
      />
    </label>
  );
}
