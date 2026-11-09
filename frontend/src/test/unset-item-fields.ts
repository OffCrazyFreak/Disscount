import type { ShoppingListItemDto } from "@/lib/api/types";

/** Spring sends every ShoppingListItemDto key, so a plain item carries empty ones as null, not left out. */
export const UNSET_ITEM_FIELDS = {
  ean: null,
  brand: null,
  quantity: null,
  unit: null,
  chainCode: null,
  avgPrice: null,
  storePrice: null,
  updatedAt: "2026-01-01T00:00:00",
  updatedByUserId: null,
} satisfies Partial<ShoppingListItemDto>;
