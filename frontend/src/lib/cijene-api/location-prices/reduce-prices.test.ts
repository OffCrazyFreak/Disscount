import { describe, expect, it } from "vitest";
import {
  mergeCityPrices,
  reduceByCity,
} from "@/lib/cijene-api/location-prices/reduce-prices";
import { storePrice } from "@/lib/cijene-api/location-prices/test-rows";

describe("reduceByCity", () => {
  it("keeps the lowest and highest price per EAN in each city", () => {
    const byCity = reduceByCity([
      storePrice("1", "Zagreb", "2.00"),
      storePrice("1", "Zagreb", "3.00", "1.50"),
      storePrice("1", "Split", "4.00"),
    ]);

    expect(byCity.get("Zagreb")?.get("1")).toEqual({ min: 1.5, max: 2 });
    expect(byCity.get("Split")?.get("1")).toEqual({ min: 4, max: 4 });
  });

  it("counts only exact city names, not upstream's substring matches", () => {
    const byCity = reduceByCity(
      [
        storePrice("1", "Sesvete", "2.00"),
        storePrice("1", "Sesvete - Kraljevec", "9.00"),
      ],
      new Set(["Sesvete"]),
    );

    expect([...byCity.keys()]).toEqual(["Sesvete"]);
    expect(byCity.get("Sesvete")?.get("1")).toEqual({ min: 2, max: 2 });
  });

  it("returns an empty city when a requested one has no prices", () => {
    const byCity = reduceByCity([], new Set(["Vis"]));

    expect(byCity.get("Vis")?.size).toBe(0);
  });

  it("skips rows without a city or a readable price", () => {
    const byCity = reduceByCity([
      storePrice("1", null, "2.00"),
      storePrice("1", "Pula", null),
    ]);

    expect(byCity.size).toBe(0);
  });
});

describe("mergeCityPrices", () => {
  it("widens each range across cities", () => {
    const merged = mergeCityPrices([
      new Map([["1", { min: 2, max: 3 }]]),
      new Map([
        ["1", { min: 1, max: 2 }],
        ["2", { min: 5, max: 5 }],
      ]),
    ]);

    expect(merged).toEqual({
      "1": { min: 1, max: 3 },
      "2": { min: 5, max: 5 },
    });
  });
});
