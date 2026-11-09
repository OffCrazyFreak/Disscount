import { describe, expect, it } from "vitest";

import { MAX_SHOPPING_LIST_ITEM_AMOUNT } from "@/constants/shopping-list";
import { shoppingListDtoSchema } from "@/lib/api/schemas/shopping-list";
import {
  shoppingListItemDtoSchema,
  shoppingListItemRequestSchema,
} from "@/lib/api/schemas/shopping-list-item";

// The shape ShoppingListItemDto serializes: Jackson sends every key, unset ones as null.
const storedItem = {
  id: "7c1e2a4b-3d5f-4a6b-8c9d-0e1f2a3b4c5d",
  shoppingListId: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  ean: "3850123456789",
  brand: "Dukat",
  name: "Mlijeko 2,8% m.m.",
  quantity: "1",
  unit: "L",
  amount: 2,
  isChecked: false,
  chainCode: "konzum",
  avgPrice: 1.29,
  storePrice: 1.19,
  createdAt: "2026-11-03T09:15:00",
  updatedAt: "2026-11-03T09:15:00",
  updatedByUserId: null,
};

describe("shoppingListItemDtoSchema", () => {
  it("accepts an amount above the form limit, which the column allows", () => {
    const amount = MAX_SHOPPING_LIST_ITEM_AMOUNT + 1;

    const parsed = shoppingListItemDtoSchema.parse({ ...storedItem, amount });

    expect(parsed.amount).toBe(amount);
  });

  it("accepts a list whose items include one above the form limit", () => {
    const list = {
      id: storedItem.shoppingListId,
      title: "Tjedna kupnja",
      ownerId: null,
      linkAccess: null,
      myAccess: "EDIT",
      createdAt: "2026-11-03T09:00:00",
      updatedAt: "2026-11-03T09:15:00",
      items: [{ ...storedItem, amount: 1500 }],
    };

    expect(shoppingListDtoSchema.safeParse(list).success).toBe(true);
  });

  it("accepts a plain item that no store sells", () => {
    const parsed = shoppingListItemDtoSchema.parse({
      ...storedItem,
      ean: null,
      brand: null,
      quantity: null,
      unit: null,
      chainCode: null,
      avgPrice: null,
      storePrice: null,
    });

    expect(parsed.ean).toBeNull();
  });

  it("rejects a list that drops the owner-only keys instead of sending null", () => {
    const list = {
      id: storedItem.shoppingListId,
      title: "Tjedna kupnja",
      myAccess: "SHOP",
      createdAt: "2026-11-03T09:00:00",
      updatedAt: "2026-11-03T09:15:00",
      items: [],
    };

    expect(shoppingListDtoSchema.safeParse(list).success).toBe(false);
  });
});

describe("shoppingListItemRequestSchema", () => {
  it("still lets a request leave out the catalog fields", () => {
    const parsed = shoppingListItemRequestSchema.parse({ name: "Kruh" });

    expect(parsed).toEqual({ name: "Kruh", amount: 1, isChecked: false });
  });
});
