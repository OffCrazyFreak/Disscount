import type { PercentCrop } from "react-image-crop";

import type { ProductImageCrop } from "@/lib/api/types";

// The server refuses anything smaller; a near-full frame is sent as no crop at all.
const MIN_SIDE = 16;
const FULL_FRAME_PERCENT = 99.5;

export function toPercent(
  crop: ProductImageCrop,
  width: number,
  height: number,
): PercentCrop {
  return {
    unit: "%",
    x: (crop.x / width) * 100,
    y: (crop.y / height) * 100,
    width: (crop.width / width) * 100,
    height: (crop.height / height) * 100,
  };
}

/** Pixels of the rotated original, clamped inside it; null when the frame covers the whole photo. */
export function toPixels(
  crop: PercentCrop,
  width: number,
  height: number,
): ProductImageCrop | null {
  if (crop.width >= FULL_FRAME_PERCENT && crop.height >= FULL_FRAME_PERCENT)
    return null;

  const x = clamp(Math.round((crop.x / 100) * width), 0, width - MIN_SIDE);
  const y = clamp(Math.round((crop.y / 100) * height), 0, height - MIN_SIDE);
  return {
    x,
    y,
    width: clamp(Math.round((crop.width / 100) * width), MIN_SIDE, width - x),
    height: clamp(
      Math.round((crop.height / 100) * height),
      MIN_SIDE,
      height - y,
    ),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
