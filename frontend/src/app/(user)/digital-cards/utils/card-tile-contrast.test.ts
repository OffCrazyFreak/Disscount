import { describe, expect, it } from "vitest";

import {
  DARK_TEXT_COLOR,
  LIGHT_TEXT_COLOR,
  contrastRatio,
  textColorFor,
} from "@/utils/color-contrast";

import { CARD_PALETTE } from "./card-palette";

type Rgb = [number, number, number];

const toLinear = (value: number) => {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
};

const toGamma = (value: number) => {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped <= 0.0031308
    ? 12.92 * clamped
    : 1.055 * clamped ** (1 / 2.4) - 0.055;
};

const parse = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const toHex = (rgb: Rgb) =>
  `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;

function toOklab([red, green, blue]: Rgb): Rgb {
  const r = toLinear(red);
  const g = toLinear(green);
  const b = toLinear(blue);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([L, a, b]: Rgb): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.round(toGamma(v) * 255)) as Rgb;
}

// Same as CSS color-mix(in oklab, base, other share).
function mix(base: Rgb, other: Rgb, share: number): Rgb {
  const from = toOklab(base);
  const to = toOklab(other);

  return fromOklab(from.map((v, i) => v * (1 - share) + to[i] * share) as Rgb);
}

// sRGB alpha compositing, the way the browser paints a translucent layer.
const over = (base: Rgb, top: Rgb, alpha: number): Rgb =>
  base.map((v, i) => Math.round(alpha * top[i] + (1 - alpha) * v)) as Rgb;

const STEPS = 100;

function worstContrast(hex: string) {
  const ink = textColorFor(hex);
  const lightInk = ink === LIGHT_TEXT_COLOR;
  const color = parse(hex);
  const away: Rgb = lightInk ? [0, 0, 0] : [255, 255, 255];
  const grey = parse(lightInk ? "#3d3d3d" : "#e2e2e2");
  const archivedBase = mix(color, grey, 0.55);
  let worst = Infinity;

  for (let i = 0; i <= STEPS; i += 1) {
    const live = mix(color, away, (0.12 * i) / STEPS);
    const archived = mix(archivedBase, away, (0.1 * i) / STEPS);
    const surfaces = [
      live,
      over(live, away, 0.11),
      archived,
      over(archived, away, 0.12),
      over(archived, away, 0.22),
    ];

    for (const surface of surfaces) {
      worst = Math.min(worst, contrastRatio(ink, toHex(surface)));
    }
  }

  return worst;
}

describe("card tile contrast", () => {
  it("uses the same ink values as the app", () => {
    expect([LIGHT_TEXT_COLOR, DARK_TEXT_COLOR]).toEqual(["#ffffff", "#111827"]);
  });

  it.each(CARD_PALETTE.map((color) => [color.name, color.hex]))(
    "%s keeps 4.5:1 across the gradient, the archived surface, the mark and the chip",
    (_name, hex) => {
      expect(worstContrast(hex)).toBeGreaterThanOrEqual(4.5);
    },
  );
});
