import type { ShoppingListItemDto } from "@/lib/api/types";

/** Spring sends every ShoppingListItemDto key, so a plain item carries these as null rather than leaving them out. */
export const UNSET_ITEM_FIELDS = {
  ean: null,
  brand: null,
  quantity: null,
  unit: null,
  chainCode: null,
  avgPrice: null,
  storePrice: null,
  updatedAt: null,
  updatedByUserId: null,
} satisfies Partial<ShoppingListItemDto>;
