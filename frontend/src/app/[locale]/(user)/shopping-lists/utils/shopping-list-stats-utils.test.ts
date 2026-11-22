import { describe, expect, it } from "vitest";

import {
  calculateShoppingListStats,
  countUnpricedItems,
} from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-stats-utils";

describe("calculateShoppingListStats", () => {
  it("leaves unpriced items out of the totals and counts them", () => {
    const items = [
      { id: "milk", amount: 2, isChecked: false },
      { id: "jars", amount: 3, isChecked: false },
      { id: "card", amount: 1, isChecked: true },
    ];
    const averagePrices = { milk: 1.5 };

    expect(
      calculateShoppingListStats(items, averagePrices).avgTotal,
    ).toBeCloseTo(3);
    expect(countUnpricedItems(items, averagePrices)).toBe(2);
  });

  it("counts a typed plain item price as spent but never as saved", () => {
    const items = [
      {
        id: "milk",
        ean: "385",
        amount: 1,
        isChecked: true,
        avgPrice: 2,
        storePrice: 1,
      },
      { id: "jars", ean: null, amount: 2, isChecked: true, storePrice: 5 },
    ];

    const stats = calculateShoppingListStats(items, { milk: 2 });

    expect(stats.moneySpent).toBeCloseTo(11);
    expect(stats.catalogSpent).toBeCloseTo(1);
    expect(stats.savedAmount).toBeCloseTo(1);
    expect(stats.savedPercentage).toBeCloseTo(50);
  });

  it("adds an unchecked typed price exactly to the totals", () => {
    const items = [
      { id: "jars", ean: null, amount: 2, isChecked: false, storePrice: 5 },
    ];

    const stats = calculateShoppingListStats(items, {});

    expect(stats.minTotal).toBeCloseTo(10);
    expect(stats.maxTotal).toBeCloseTo(10);
    expect(stats.avgToSpend).toBeCloseTo(10);
    expect(countUnpricedItems(items, {})).toBe(0);
  });
});
