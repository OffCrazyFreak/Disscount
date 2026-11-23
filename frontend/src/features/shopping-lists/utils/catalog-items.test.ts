import { describe, expect, it } from "vitest";

import type { ShoppingListItemDto } from "@/lib/api/schemas/shopping-list-item";
import {
  catalogEans,
  itemsToCompare,
} from "@/features/shopping-lists/utils/catalog-items";
import { UNSET_ITEM_FIELDS } from "@/test/backend/unset-item-fields";

function item(ean: string | null, name: string): ShoppingListItemDto {
  return {
    ...UNSET_ITEM_FIELDS,
    id: `${ean}-${name}`,
    shoppingListId: "list",
    ean,
    name,
    amount: 1,
    isChecked: false,
    createdAt: "2026-11-02T10:00:00",
  };
}

describe("catalogEans", () => {
  it("skips plain items and repeats", () => {
    expect(
      catalogEans([item("1", "a"), item(null, "b"), item("1", "c")]),
    ).toEqual(["1"]);
  });
});

describe("itemsToCompare", () => {
  it("keeps only products still to buy", () => {
    const bought = { ...item("2", "b"), isChecked: true };

    expect(
      itemsToCompare([item("1", "a"), bought, item(null, "c")]).map(
        (entry) => entry.ean,
      ),
    ).toEqual(["1"]);
  });
});
