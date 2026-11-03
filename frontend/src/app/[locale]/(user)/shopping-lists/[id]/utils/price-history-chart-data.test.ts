import { describe, expect, it } from "vitest";

import { buildChartConfig } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/price-history-chart-data";

describe("buildChartConfig", () => {
  it("labels only items that have price history", () => {
    const base = {
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
