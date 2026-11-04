import { z } from "zod";
import { MAX_SHOPPING_LIST_ITEM_AMOUNT } from "@/constants/shopping-list";

const shoppingListItemFieldsSchema = z.object({
  // Null for a plain item, typed by the user, that no store in the catalog sells.
  ean: z.string().nullable(),
  brand: z.string().nullable(),
  quantity: z.string().nullable(),
  unit: z.string().nullable(),
  chainCode: z.string().nullable(),
  avgPrice: z.number().nullable(),
  storePrice: z.number().nullable(),
});

// Partial because a request may leave any of them out; the response always sends every key.
export const shoppingListItemRequestSchema = shoppingListItemFieldsSchema
  .partial()
  .extend({
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

// Not an extension of the request schema, because a row the server holds (saved before a limit, or imported) must still parse.
export const shoppingListItemDtoSchema = shoppingListItemFieldsSchema.extend({
  id: z.string(),
  shoppingListId: z.string(),
  name: z.string(),
  amount: z.number().int(),
  isChecked: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  updatedByUserId: z.string().nullable(),
});

export type ShoppingListItemRequest = z.infer<
  typeof shoppingListItemRequestSchema
>;
export type ShoppingListItemDto = z.infer<typeof shoppingListItemDtoSchema>;
