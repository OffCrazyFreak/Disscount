import { describe, expect, it } from "vitest";

import {
  fitPadding,
  isSameSpot,
  leafBounds,
} from "@/features/map/utils/view/cluster-leaves";

describe("isSameSpot", () => {
  it("treats stores within a few metres as one spot", () => {
    expect(
      isSameSpot([
        { key: "spar", lon: 15.9681, lat: 45.7754 },
        { key: "dm", lon: 15.9681, lat: 45.7754 },
        { key: "ktc", lon: 15.96815, lat: 45.77548 },
      ]),
    ).toBe(true);
  });

  it("keeps stores a street apart separate", () => {
    expect(
      isSameSpot([
        { key: "spar", lon: 15.9681, lat: 45.7754 },
        { key: "lidl", lon: 15.9701, lat: 45.7754 },
      ]),
    ).toBe(false);
  });
});

describe("leafBounds", () => {
  it("spans every store", () => {
    expect(
      leafBounds([
        { key: "a", lon: 16, lat: 45.9 },
        { key: "b", lon: 15.9, lat: 45.8 },
      ]),
    ).toEqual([
      [15.9, 45.8],
      [16, 45.9],
    ]);
  });
});

describe("fitPadding", () => {
  it("keeps a 64 px margin where there is room", () => {
    expect(fitPadding(800, 600, { top: 0, bottom: 0, right: 0 })).toEqual({
      top: 64,
      right: 64,
      bottom: 64,
      left: 64,
    });
  });

  it("fits inside a short map with the sheet up", () => {
    // A phone in landscape: 230 px of map, 126 px of it under the sheet.
    const padding = fitPadding(700, 230, { top: 0, bottom: 126, right: 0 });

    expect(padding.top + padding.bottom).toBeLessThan(230);
    expect(padding.bottom).toBeGreaterThan(126);
  });

  it("keeps the stores clear of the desktop search panel on the right", () => {
    const padding = fitPadding(1400, 700, { top: 0, bottom: 0, right: 400 });

    expect(padding.right).toBe(464);
    expect(padding.left).toBe(64);
  });

  it("keeps the stores clear of the header floating over the map", () => {
    const padding = fitPadding(1400, 900, { top: 80, bottom: 0, right: 0 });

    expect(padding.top).toBe(144);
    expect(padding.bottom).toBe(64);
  });
});
