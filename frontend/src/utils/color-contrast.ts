export const DARK_TEXT_COLOR = "#111827";
export const LIGHT_TEXT_COLOR = "#ffffff";

function channel(value: number) {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string) {
  const red = channel(parseInt(hex.slice(1, 3), 16));
  const green = channel(parseInt(hex.slice(3, 5), 16));
  const blue = channel(parseInt(hex.slice(5, 7), 16));

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** WCAG 2 contrast ratio between two #rrggbb colours, from 1 to 21. */
export function contrastRatio(first: string, second: string) {
  const [lighter, darker] = [
    relativeLuminance(first),
    relativeLuminance(second),
  ].sort((a, b) => b - a);

  return (lighter + 0.05) / (darker + 0.05);
}

/** White or near-black, whichever reads better on the given background. */
export function textColorFor(background: string) {
  const onWhite = contrastRatio(background, LIGHT_TEXT_COLOR);
  const onDark = contrastRatio(background, DARK_TEXT_COLOR);

  return onWhite >= onDark ? LIGHT_TEXT_COLOR : DARK_TEXT_COLOR;
}
