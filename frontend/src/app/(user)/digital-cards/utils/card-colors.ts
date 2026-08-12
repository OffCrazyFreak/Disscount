/**
 * Card colours are locked to one saturation and lightness pair, so the wallet reads as one
 * designed set. The hue slider and the swatches are therefore the same system: a swatch is
 * just a hue stop.
 *
 * Locking them does NOT make white text legible everywhere. Yellow and green sit far
 * brighter than blue at the same lightness, so hue 55 lands near 2.7:1 against white
 * against a 4.5:1 minimum. Text colour is chosen per card by foregroundFor() instead,
 * which also covers the chain brand colours, several of which are lighter still.
 */
const CARD_SATURATION = 62;
const CARD_LIGHTNESS = 42;

export const DEFAULT_CARD_COLOR = "#64748b";

// Neutrals cannot come from the hue formula, so they are listed as literals and sort last.
export const NEUTRAL_CARD_COLORS = [
  DEFAULT_CARD_COLOR,
  "#334155",
  "#1f2937",
] as const;

const SWATCH_HUES = [0, 20, 40, 55, 90, 150, 175, 200, 225, 265, 300, 330];

export function hslToHex(hue: number, saturation: number, lightness: number) {
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * (saturation / 100);

  const channel = (offset: number) => {
    const k = (offset + hue / 30) % 12;
    const value = l - (chroma / 2) * Math.max(-1, Math.min(k - 3, 9 - k, 1));

    return Math.round(255 * value)
      .toString(16)
      .padStart(2, "0");
  };

  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");

  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

/** Ink for a coloured card, dark enough to clear 4.5:1 wherever white cannot. */
export const CARD_INK_LIGHT = "#ffffff";
export const CARD_INK_DARK = "#1c1917";

/** Any card colour must clear this against whichever ink foregroundFor picks. */
const MIN_CONTRAST = 4.5;
const LIGHTNESS_STEP = 2;
const MIN_LIGHTNESS = 20;

function channelLuminance(channel: number): number {
  const c = channel / 255;

  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, the basis of every contrast ratio below. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(channelLuminance);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The readable ink for a given card colour. Picks whichever of the two clears 4.5:1 by
 * more, so a freeform hue and a curated brand colour are both covered by one rule rather
 * than by trusting the palette.
 */
export function foregroundFor(background: string): string {
  return contrastRatio(background, CARD_INK_LIGHT) >=
    contrastRatio(background, CARD_INK_DARK)
    ? CARD_INK_LIGHT
    : CARD_INK_DARK;
}

/**
 * The hex a given hue produces, which is what both the slider and the swatches emit.
 *
 * Most hues are legible at the base lightness under one ink or the other, but a band
 * around cyan (hue 200 or so) sits in a dead zone where neither clears 4.5. Darkening
 * only ever raises contrast against white, so those hues step down until one ink works.
 * In practice that is a two point drop on a handful of hues, invisible beside them.
 */
export function hexForHue(hue: number): string {
  for (
    let lightness = CARD_LIGHTNESS;
    lightness > MIN_LIGHTNESS;
    lightness -= LIGHTNESS_STEP
  ) {
    const hex = hslToHex(hue, CARD_SATURATION, lightness);
    if (contrastRatio(hex, foregroundFor(hex)) >= MIN_CONTRAST) return hex;
  }

  return hslToHex(hue, CARD_SATURATION, MIN_LIGHTNESS);
}

export const CARD_SWATCHES: string[] = [
  ...SWATCH_HUES.map(hexForHue),
  ...NEUTRAL_CARD_COLORS,
];

export interface IHueInfo {
  hue: number;
  /** Below this, a colour is a grey and has no meaningful hue to sort by. */
  isNeutral: boolean;
}

export function hueFromHex(hex: string): IHueInfo {
  const [r, g, b] = hexToRgb(hex).map((channel) => channel / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta < 0.08) return { hue: 0, isNeutral: true };

  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;

  hue = Math.round(hue * 60);

  return { hue: hue < 0 ? hue + 360 : hue, isNeutral: false };
}

/**
 * Curated brand colours for the official chains, used to prefill a new card's colour.
 * Deliberately hand-picked rather than sampled from the logo PNGs: several logos are
 * mostly white, and a few brand reds are too light to carry white text.
 */
export const CHAIN_BRAND_COLORS: Record<string, string> = {
  konzum: "#c8102e",
  lidl: "#0050aa",
  plodine: "#e2001a",
  tommy: "#d81f26",
  spar: "#007a33",
  kaufland: "#e10915",
  studenac: "#0a5c36",
  eurospin: "#f47b20",
  dm: "#00589c",
  metro: "#003d7c",
  ktc: "#0a6ebd",
  ntl: "#1b5e20",
  ribola: "#0072bc",
  boso: "#c62828",
  bure: "#8d6e63",
  vrutak: "#2e7d32",
  zabac: "#43a047",
  roto: "#1565c0",
  branka: "#ad1457",
  brodokomerc: "#00695c",
  gavranovic: "#b71c1c",
  jadranka_trgovina: "#0277bd",
  lorenco: "#6a1b9a",
  stanic: "#37474f",
  stridon: "#455a64",
  trgocentar: "#ef6c00",
  "trgovina-krk": "#0288d1",
  djelo_vodice: "#00838f",
  dukat: "#1976d2",
};
