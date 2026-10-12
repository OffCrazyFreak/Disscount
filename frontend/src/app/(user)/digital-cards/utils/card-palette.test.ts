import { describe, expect, it } from "vitest";

import { contrastRatio, textColorFor } from "@/utils/color-contrast";

import { CHAIN_DEFAULT_COLORS } from "./chain-default-colors";
import { CARD_PALETTE } from "./card-palette";

const angles = (ring: number) =>
  CARD_PALETTE.filter((color) => color.ring === ring)
    .map((color) => color.angle)
    .sort((a, b) => a - b);

describe("CARD_PALETTE", () => {
  it("has 19 unique colours", () => {
    expect(CARD_PALETTE).toHaveLength(19);
    expect(new Set(CARD_PALETTE.map((c) => c.hex.toLowerCase())).size).toBe(19);
  });

  it.each(CARD_PALETTE.map((color) => [color.name, color.hex]))(
    "%s keeps 4.5:1 against its text colour",
    (_name, hex) => {
      expect(contrastRatio(hex, textColorFor(hex))).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("lays out one centre, six inner and twelve outer cells", () => {
    expect(angles(0)).toHaveLength(1);
    expect(angles(1)).toEqual([0, 60, 120, 180, 240, 300]);
    expect(angles(2)).toEqual(Array.from({ length: 12 }, (_, i) => i * 30));
  });

  it("only maps chains to palette colours", () => {
    const hexes = new Set(CARD_PALETTE.map((color) => color.hex));

    for (const hex of Object.values(CHAIN_DEFAULT_COLORS)) {
      expect(hexes.has(hex)).toBe(true);
    }
  });
});
