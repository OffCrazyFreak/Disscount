import { describe, expect, it } from "vitest";

import {
  buildChartConfig,
  buildChartData,
} from "@/app/[locale]/(user)/shopping-lists/[id]/utils/price-history-chart-data";
import { UNSET_ITEM_FIELDS } from "@/test/unset-item-fields";

describe("buildChartData", () => {
  it("keeps raw dates in chronological order, which the chart formats per locale", () => {
    const product = (avgPrice: string) => ({
      ean: "1",
      brand: null,
      name: "Mlijeko",
      quantity: null,
      unit: null,
      chains: [
        {
          chain: "konzum",
          code: "1",
          name: "Mlijeko",
          brand: null,
          category: null,
          unit: null,
          quantity: null,
          avg_price: avgPrice,
          min_price: avgPrice,
          max_price: avgPrice,
          price_date: "2026-11-03",
        },
      ],
    });

    expect(
      buildChartData(
        { "1": [product("1.30"), product("1.20")] },
        ["1"],
        ["2026-11-04", "2026-11-03"],
        ["konzum"],
      ),
    ).toEqual([
      { date: "2026-11-03", "1": 1.2 },
      { date: "2026-11-04", "1": 1.3 },
    ]);
  });
});

describe("buildChartConfig", () => {
  it("labels only items that have price history", () => {
    const base = {
      ...UNSET_ITEM_FIELDS,
      shoppingListId: "list",
      amount: 1,
      isChecked: false,
      createdAt: "2026-11-02T10:00:00",
    };

    expect(
      buildChartConfig([
        { ...base, id: "a", ean: "1", name: "Mlijeko", brand: "Dukat" },
        { ...base, id: "b", ean: null, name: "Staklenke" },
      ]),
    ).toEqual({ "1": { label: "Dukat Mlijeko" } });
  });
});
