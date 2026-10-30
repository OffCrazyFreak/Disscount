import { z } from "zod";
import { MAX_SHOPPING_LIST_ITEM_AMOUNT } from "@/constants/shopping-list";

const shoppingListItemRequestSchema = z.object({
  ean: z.string().min(1, "shoppingLists.validation.eanRequired"),
  name: z.string().min(1, "shoppingLists.validation.nameRequired"),
  brand: z.string().nullable().optional(),
  quantity: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  amount: z
    .number()
    .int()
    .min(1, "shoppingLists.validation.amountMin")
    // The message text states the limit as a literal: keys cannot take parameters.
    .max(MAX_SHOPPING_LIST_ITEM_AMOUNT, "shoppingLists.validation.amountMax")
    .default(1),
  isChecked: z.boolean().default(false),
  chainCode: z.string().nullable().optional(),
  avgPrice: z.number().nullable().optional(),
  storePrice: z.number().nullable().optional(),
});

// DTO schemas extend request schemas
export const shoppingListItemDtoSchema = shoppingListItemRequestSchema.extend({
  id: z.string(),
  shoppingListId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
  updatedByUserId: z.string().nullable().optional(),
});

// Type exports
export type ShoppingListItemRequest = z.infer<
  typeof shoppingListItemRequestSchema
>;
export type ShoppingListItemDto = z.infer<typeof shoppingListItemDtoSchema>;
