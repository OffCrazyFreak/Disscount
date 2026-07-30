/**
 * Card colours are locked to one saturation and lightness pair, so every hue the user can
 * reach stays legible under white text and the wallet reads as one designed set. The hue
 * slider and the swatches are therefore the same system: a swatch is just a hue stop.
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

/** The hex a given hue produces, which is what both the slider and the swatches emit. */
export function hexForHue(hue: number): string {
  return hslToHex(hue, CARD_SATURATION, CARD_LIGHTNESS);
}

export const CARD_SWATCHES: string[] = [
  ...SWATCH_HUES.map(hexForHue),
  ...NEUTRAL_CARD_COLORS,
];

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");

  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

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
