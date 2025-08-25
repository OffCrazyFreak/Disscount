import { z } from "zod";

// Shopping List schemas
export const shoppingListSchema = z.object({
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

export const shoppingListItemSchema = z.object({
  productApiId: z.string().min(1, "Product API ID je obavezan"),
  productName: z.string().min(1, "Naziv proizvoda je obavezan"),
  amount: z.number().int().min(1, "Količina mora biti veća od 0").optional(),
  isChecked: z.boolean().optional(),
});

// Type exports
export type ShoppingListFormType = z.infer<typeof shoppingListSchema>;
export type ShoppingListItemFormType = z.infer<typeof shoppingListItemSchema>;
