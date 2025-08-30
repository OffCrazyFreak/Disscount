import { z } from "zod";
import { shoppingListItemDtoSchema } from "@/lib/api/schemas/shopping-list-item";

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
export type ShoppingListDto = z.infer<typeof shoppingListDtoSchema>;
