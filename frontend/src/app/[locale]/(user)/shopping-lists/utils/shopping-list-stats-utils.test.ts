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
});
