import { describe, expect, it } from "vitest";

import type { ShoppingListItemDto } from "@/lib/api/types";
import { groupItemsByStore } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/group-items-by-store";
import { UNSET_ITEM_FIELDS } from "@/test/unset-item-fields";

function item(
  id: string,
  name: string,
  extra: Partial<ShoppingListItemDto> = {},
): ShoppingListItemDto {
  return {
    ...UNSET_ITEM_FIELDS,
    id,
    name,
    ean: id,
    amount: 1,
    isChecked: false,
    shoppingListId: "list",
    createdAt: "2026-10-27T00:00:00",
    ...extra,
  };
}

describe("groupItemsByStore", () => {
  it("groups by the chosen chain, else the cheapest, with unknown items last", () => {
    const groups = groupItemsByStore({
      items: [
        item("1", "Mlijeko", { chainCode: "lidl" }),
        item("2", "Kruh"),
        item("3", "Sol"),
        item("4", "Jaja", { chainCode: "lidl" }),
      ],
      cheapestStores: { "2": "konzum" },
      storePrices: {},
    });

    expect(groups.map((g) => [g.chain, g.items.map((i) => i.name)])).toEqual([
      ["konzum", ["Kruh"]],
      ["lidl", ["Jaja", "Mlijeko"]],
      [null, ["Sol"]],
    ]);
  });

  it("totals the group at its chain and flags a missing price", () => {
    const [group] = groupItemsByStore({
      items: [
        item("1", "Mlijeko", { chainCode: "lidl", amount: 2 }),
        item("2", "Kruh", { chainCode: "lidl" }),
        item("3", "Jaja", {
          chainCode: "lidl",
          isChecked: true,
          storePrice: 3,
        }),
      ],
      cheapestStores: {},
      storePrices: { "1": { lidl: 1.5 } },
    });

    expect(group.subtotal).toBe(6);
    expect(group.isPartial).toBe(true);
  });

  it("puts an item ticked with no saved chain under no store, as its select shows", () => {
    const groups = groupItemsByStore({
      items: [
        item("1", "Kruh", { isChecked: true, storePrice: null }),
        item("2", "Mlijeko"),
      ],
      cheapestStores: { "1": "konzum", "2": "konzum" },
      storePrices: { "1": { konzum: 1.5 }, "2": { konzum: 2 } },
    });

    expect(groups.map((g) => [g.chain, g.items.map((i) => i.name)])).toEqual([
      ["konzum", ["Mlijeko"]],
      [null, ["Kruh"]],
    ]);
    expect(groups[0]).toMatchObject({ subtotal: 2, isPartial: false });
  });

  it("prices a ticked item with no captured price at today's price at its chain", () => {
    const [group] = groupItemsByStore({
      items: [
        item("1", "Kruh", {
          chainCode: "konzum",
          isChecked: true,
          storePrice: null,
        }),
      ],
      cheapestStores: {},
      storePrices: { "1": { konzum: 1.5 } },
    });

    expect(group).toMatchObject({ subtotal: 1.5, isPartial: false });
  });
});
