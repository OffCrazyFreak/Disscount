import { describe, expect, it } from "vitest";

import { buildChartConfig } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/price-history-chart-data";
import { UNSET_ITEM_FIELDS } from "@/test/unset-item-fields";

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
