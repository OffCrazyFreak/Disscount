import { describe, expect, it } from "vitest";

import { getStoreCardMetrics } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/store-card-utils";
import type { ChainSummary } from "@/app/[locale]/(user)/shopping-lists/[id]/typings/store-chain-types";
import type { ShoppingListDto } from "@/lib/api/types";

const chain = {
  chain: "konzum",
  min_price: "1.00",
  avg_price: "2.00",
  max_price: "3.00",
  price_date: "2026-11-02",
  itemCount: 1,
} as ChainSummary;

function listWith(items: Array<{ ean: string | null; isChecked: boolean }>) {
  return {
    items: items.map((item, index) => ({
      ...item,
      id: String(index),
      shoppingListId: "list",
      name: `item ${index}`,
      amount: 1,
      createdAt: "2026-11-02T10:00:00",
    })),
  } as ShoppingListDto;
}

describe("getStoreCardMetrics", () => {
  it("lets a store cover the list when only plain items are missing", () => {
    const metrics = getStoreCardMetrics({
      chain,
      shoppingList: listWith([
        { ean: "1", isChecked: false },
        { ean: null, isChecked: false },
      ]),
      absoluteMinPrice: 1,
      absoluteMaxPrice: 3,
      pinnedStores: [],
    });

    expect(metrics.totalItemsInList).toBe(1);
    expect(metrics.hasAllItems).toBe(true);
  });
});
