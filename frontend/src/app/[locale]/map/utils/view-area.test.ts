import { describe, expect, it } from "vitest";

import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import {
  IViewArea,
  sameView,
  splitByView,
} from "@/app/[locale]/map/utils/view-area";

function row(key: string, lat: number | null, lon: number | null) {
  return { key, store: { lat, lon } } as IListedStore;
}

function box(west: number, south: number, east: number, north: number) {
  return {
    corners: [
      [west, north],
      [east, north],
      [east, south],
      [west, south],
    ],
  } as IViewArea;
}

const ZAGREB = box(15.9, 45.7, 16.1, 45.9);

describe("splitByView", () => {
  it("puts stores inside the view first and keeps the order in each group", () => {
    const rows = [
      row("split", 43.5, 16.4),
      row("ilica", 45.81, 15.97),
      row("unplaced", null, null),
      row("savska", 45.8, 15.96),
    ];

    const { onMap, elsewhere } = splitByView(rows, ZAGREB);

    expect(onMap.map((r) => r.key)).toEqual(["ilica", "savska"]);
    expect(elsewhere.map((r) => r.key)).toEqual(["split", "unplaced"]);
  });

  it("leaves out stores past the edge of a rotated map", () => {
    // A map turned 45 degrees: a diamond, whose bounding box would also hold
    // the store near its corner.
    const rotated: IViewArea = {
      corners: [
        [16, 46],
        [16.1, 45.8],
        [16, 45.6],
        [15.9, 45.8],
      ],
    };
    const rows = [row("centre", 45.8, 16), row("corner", 45.98, 16.08)];

    const { onMap, elsewhere } = splitByView(rows, rotated);

    expect(onMap.map((r) => r.key)).toEqual(["centre"]);
    expect(elsewhere.map((r) => r.key)).toEqual(["corner"]);
  });

  it("leaves every store elsewhere before the map reports its view", () => {
    const rows = [row("ilica", 45.81, 15.97)];

    expect(splitByView(rows, null)).toEqual({ onMap: [], elsewhere: rows });
  });
});

describe("sameView", () => {
  it("compares by value", () => {
    expect(sameView(ZAGREB, box(15.9, 45.7, 16.1, 45.9))).toBe(true);
    expect(sameView(ZAGREB, box(15.9, 45.7, 16.1, 46))).toBe(false);
    expect(sameView(null, null)).toBe(true);
    expect(sameView(ZAGREB, null)).toBe(false);
  });
});
