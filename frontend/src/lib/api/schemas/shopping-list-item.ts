import { z } from "zod";

export const shoppingListItemRequestSchema = z.object({
  ean: z.string().min(1, "EAN kod je obavezan"),
  name: z.string().min(1, "Naziv proizvoda je obavezan"),
  brand: z.string().nullable().optional(),
  quantity: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  amount: z.number().int().min(1, "Količina mora biti veća od 0").default(1),
  isChecked: z.boolean().default(false),
});

// DTO schemas extend request schemas
export const shoppingListItemDtoSchema = shoppingListItemRequestSchema.extend({
  id: z.string(),
  shoppingListId: z.string(),
  createdAt: z.string(),
});

// Type exports
export type ShoppingListItemRequest = z.infer<
  typeof shoppingListItemRequestSchema
>;
export type ShoppingListItemDto = z.infer<typeof shoppingListItemDtoSchema>;
