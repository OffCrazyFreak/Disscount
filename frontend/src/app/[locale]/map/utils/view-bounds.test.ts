import { describe, expect, it } from "vitest";

import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { sameBounds, splitByView } from "@/app/[locale]/map/utils/view-bounds";

function row(key: string, lat: number | null, lon: number | null) {
  return { key, store: { lat, lon } } as IListedStore;
}

const ZAGREB = { west: 15.9, south: 45.7, east: 16.1, north: 45.9 };

describe("splitByView", () => {
  it("puts stores inside the bounds first and keeps the order in each group", () => {
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

  it("leaves every store elsewhere before the map reports its view", () => {
    const rows = [row("ilica", 45.81, 15.97)];

    expect(splitByView(rows, null)).toEqual({ onMap: [], elsewhere: rows });
  });
});

describe("sameBounds", () => {
  it("compares by value", () => {
    expect(sameBounds(ZAGREB, { ...ZAGREB })).toBe(true);
    expect(sameBounds(ZAGREB, { ...ZAGREB, north: 46 })).toBe(false);
    expect(sameBounds(null, null)).toBe(true);
    expect(sameBounds(ZAGREB, null)).toBe(false);
  });
});
