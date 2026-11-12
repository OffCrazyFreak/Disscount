export const DARK_TEXT_COLOR = "#111827";
export const LIGHT_TEXT_COLOR = "#ffffff";

/** sRGB channels from 0 to 1. */
export type Rgb = [number, number, number];

function relativeLuminance(rgb: Rgb) {
  const [red, green, blue] = rgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function hexToRgb(hex: string): Rgb {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

export function rgbContrastRatio(first: Rgb, second: Rgb) {
  const [lighter, darker] = [
    relativeLuminance(first),
    relativeLuminance(second),
  ].sort((a, b) => b - a);

  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastRatio(first: string, second: string) {
  return rgbContrastRatio(hexToRgb(first), hexToRgb(second));
}

/** White or near-black, whichever reads better on the given background. */
export function textColorFor(background: string) {
  const onWhite = contrastRatio(background, LIGHT_TEXT_COLOR);
  const onDark = contrastRatio(background, DARK_TEXT_COLOR);

  return onWhite >= onDark ? LIGHT_TEXT_COLOR : DARK_TEXT_COLOR;
}
