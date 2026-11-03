import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { badgeVariants } from "@/components/ui/badge";
import { contrastRatio, oklchToRgb, type Rgb } from "@/test/color-contrast";

type Mode = "light" | "dark";
type Colors = Map<string, Rgb>;

const VARIANTS = [
  "primary",
  "primarySoft",
  "destructive",
  "destructiveSoft",
  "warning",
  "warningSoft",
  "info",
  "infoSoft",
  "outline",
] as const;

// Owner decisions: white on the brand green stays, and the blue badge keeps its
// original fill, so both fail on purpose.
const ACCEPTED_FAILURES = new Set(["primary light", "info light", "info dark"]);

const SURFACES = ["background", "card"];
const WCAG_AA_NORMAL_TEXT = 4.5;

function readColors(css: string, pattern: RegExp, percent: boolean): Colors {
  const colors: Colors = new Map();

  for (const [, name, lightness, chroma, hue] of css.matchAll(pattern)) {
    const scaled = percent ? Number(lightness) / 100 : Number(lightness);

    colors.set(name, oklchToRgb(scaled, Number(chroma), Number(hue)));
  }

  return colors;
}

function cssBlock(css: string, selector: string) {
  const start = css.indexOf(`\n${selector} {`);

  return css.slice(start, css.indexOf("\n}", start));
}

const globals = readFileSync(
  join(process.cwd(), "src/app/globals.css"),
  "utf8",
);
const palette = readColors(
  readFileSync(
    join(process.cwd(), "node_modules/tailwindcss/theme.css"),
    "utf8",
  ),
  /--color-([a-z]+-\d+): oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)/g,
  true,
);
const tokenPattern = /--([a-z-]+): oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/g;
const lightTokens = readColors(cssBlock(globals, ":root"), tokenPattern, false);
const tokens: Record<Mode, Colors> = {
  light: lightTokens,
  dark: new Map([
    ...lightTokens,
    ...readColors(cssBlock(globals, ".dark"), tokenPattern, false),
  ]),
};

function resolveColor(name: string, mode: Mode): Rgb | undefined {
  if (name === "white") return [1, 1, 1];

  return palette.get(name) ?? tokens[mode].get(name);
}

function overSurface(color: Rgb, alpha: number, surface: Rgb) {
  return color.map(
    (channel, index) => channel * alpha + surface[index] * (1 - alpha),
  ) as Rgb;
}

// Later classes of the same slot win here the way the dark: and hover: ones do in the browser.
function readSlots(variant: (typeof VARIANTS)[number], mode: Mode) {
  const slots = new Map<string, { name: string; alpha: number }>();
  const classes = badgeVariants({ variant }).split(/\s+/);
  const prefixes = mode === "dark" ? ["", "dark:"] : [""];

  for (const prefix of prefixes) {
    for (const className of classes) {
      const match = className.match(
        /^(dark:)?(\[a&\]:hover:)?(text|bg)-([a-z-]+\d*)(?:\/(\d+))?$/,
      );

      if (!match || (match[1] ?? "") !== prefix) continue;
      if (!resolveColor(match[4], mode)) {
        throw new Error(`${variant} uses unknown color ${className}`);
      }

      slots.set(`${match[2] ? "hover " : ""}${match[3]}`, {
        name: match[4],
        alpha: match[5] ? Number(match[5]) / 100 : 1,
      });
    }
  }

  return slots;
}

const cases = VARIANTS.flatMap((variant) =>
  (["light", "dark"] as const).flatMap((mode) =>
    ACCEPTED_FAILURES.has(`${variant} ${mode}`)
      ? []
      : SURFACES.flatMap((surface) =>
          ["", "hover "].map((state) => ({ variant, mode, surface, state })),
        ),
  ),
);

describe("badge text contrast", () => {
  it.each(cases)(
    "$variant $state meets AA in $mode on $surface",
    ({ variant, mode, surface, state }) => {
      const slots = readSlots(variant, mode);
      const surfaceColor = resolveColor(surface, mode) as Rgb;
      const text = slots.get(`${state}text`) ?? slots.get("text");
      const fill = slots.get(`${state}bg`) ?? slots.get("bg");

      if (!text) throw new Error(`${variant} sets no text color`);

      const fillColor = fill
        ? overSurface(
            resolveColor(fill.name, mode) as Rgb,
            fill.alpha,
            surfaceColor,
          )
        : surfaceColor;

      expect(
        contrastRatio(resolveColor(text.name, mode) as Rgb, fillColor),
      ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    },
  );
});
