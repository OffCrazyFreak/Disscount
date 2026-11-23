import { describe, expect, it } from "vitest";

import type { ShoppingListItemDto } from "@/lib/api/schemas/shopping-list-item";
import { mergesIntoExisting } from "@/features/products/utils/item-merge";
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

describe("mergesIntoExisting", () => {
  it("merges a plain item into one with the same name, ignoring case and spaces", () => {
    expect(
      mergesIntoExisting([item(null, "Čaše za vino")], {
        name: "  čaše ZA vino ",
      }),
    ).toBe(true);
  });

  it("keeps two products with the same name apart", () => {
    expect(
      mergesIntoExisting([item("1", "Mlijeko")], { ean: "2", name: "Mlijeko" }),
    ).toBe(false);
  });

  it("merges the same product by EAN even under another name", () => {
    expect(
      mergesIntoExisting([item("1", "Mlijeko 1L")], { ean: "1", name: "x" }),
    ).toBe(true);
  });

  it("lets a product take over a plain row with its name", () => {
    expect(
      mergesIntoExisting([item(null, "mlijeko")], {
        ean: "1",
        name: "Mlijeko",
      }),
    ).toBe(true);
  });

  it("merges a plain item into a product with its name", () => {
    expect(
      mergesIntoExisting([item("1", "Mlijeko")], { name: "mlijeko" }),
    ).toBe(true);
  });
});
