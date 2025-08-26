import { z } from "zod";

// Shopping List schemas
export const shoppingListRequestSchema = z.object({
  title: z
    .string()
    .min(3, "Naziv mora imati najmanje 3 znaka")
    .max(100, "Naziv može imati najviše 100 znakova"),
  isPublic: z.boolean().optional(),
  aiPrompt: z
    .string()
    .max(200, "AI prompt može imati najviše 200 znakova")
    .optional(),
});

export const shoppingListItemRequestSchema = z.object({
  productApiId: z.string().min(1, "Product API ID je obavezan"),
  productName: z.string().min(1, "Naziv proizvoda je obavezan"),
  amount: z.number().int().min(1, "Količina mora biti veća od 0").optional(),
  isChecked: z.boolean().optional(),
});

// DTO schemas extend request schemas
export const shoppingListItemDtoSchema = shoppingListItemRequestSchema.extend({
  id: z.string(),
  shoppingListId: z.string(),
  amount: z.number().int().min(1),
  isChecked: z.boolean(),
  createdAt: z.string(),
});

export const shoppingListDtoSchema = shoppingListRequestSchema.extend({
  id: z.string(),
  ownerId: z.string(),
  isPublic: z.boolean(),
  aiAnswer: z.string().optional(),
  updatedAt: z.string(),
  createdAt: z.string(),
  items: z.array(shoppingListItemDtoSchema),
});

// Type exports
export type ShoppingListRequest = z.infer<typeof shoppingListRequestSchema>;
export type ShoppingListItemRequest = z.infer<
  typeof shoppingListItemRequestSchema
>;
export type ShoppingListDto = z.infer<typeof shoppingListDtoSchema>;
export type ShoppingListItemDto = z.infer<typeof shoppingListItemDtoSchema>;
