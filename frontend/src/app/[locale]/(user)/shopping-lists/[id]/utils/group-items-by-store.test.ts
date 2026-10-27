import { describe, expect, it } from "vitest";

import type { ShoppingListItemDto } from "@/lib/api/types";
import { groupItemsByStore } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/group-items-by-store";

function item(
  id: string,
  name: string,
  extra: Partial<ShoppingListItemDto> = {},
): ShoppingListItemDto {
  return {
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
});
