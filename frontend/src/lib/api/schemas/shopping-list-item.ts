import { z } from "zod";
import { MAX_SHOPPING_LIST_ITEM_AMOUNT } from "@/constants/shopping-list";

// The fields that carry no form rule, so the request and the response can share them.
const shoppingListItemFieldsSchema = z.object({
  // Null for a plain item, typed by the user, that no store in the catalog sells.
  ean: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  quantity: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  chainCode: z.string().nullable().optional(),
  avgPrice: z.number().nullable().optional(),
  storePrice: z.number().nullable().optional(),
});

export const shoppingListItemRequestSchema =
  shoppingListItemFieldsSchema.extend({
    name: z.string().min(1, "shoppingLists.validation.nameRequired"),
    amount: z
      .number()
      .int()
      .min(1, "shoppingLists.validation.amountMin")
      // The message text states the limit as a literal: keys cannot take parameters.
      .max(MAX_SHOPPING_LIST_ITEM_AMOUNT, "shoppingLists.validation.amountMax")
      .default(1),
    isChecked: z.boolean().default(false),
  });

// Not an extension of the request schema: its limits are form rules, and a row the server
// holds (saved before a limit existed, or imported) must still parse.
export const shoppingListItemDtoSchema = shoppingListItemFieldsSchema.extend({
  id: z.string(),
  shoppingListId: z.string(),
  name: z.string(),
  amount: z.number().int(),
  isChecked: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
  updatedByUserId: z.string().nullable().optional(),
});

export type ShoppingListItemRequest = z.infer<
  typeof shoppingListItemRequestSchema
>;
export type ShoppingListItemDto = z.infer<typeof shoppingListItemDtoSchema>;
