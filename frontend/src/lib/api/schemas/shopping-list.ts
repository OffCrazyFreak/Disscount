import { z } from "zod";
import { shoppingListItemDtoSchema } from "@/lib/api/schemas/shopping-list-item";

// What a share link grants. OWNER is only ever a resolved answer, never a level the
// owner can pick, so it is absent here and present in listAccessSchema below.
export const linkAccessSchema = z.enum(["NONE", "VIEW", "SHOP", "EDIT"]);
export const listAccessSchema = z.enum([
  "NONE",
  "VIEW",
  "SHOP",
  "EDIT",
  "OWNER",
]);

// Shopping List schemas
export const shoppingListRequestSchema = z.object({
  title: z
    .string()
    .min(3, "Naziv mora imati najmanje 3 znaka")
    .max(100, "Naziv može imati najviše 100 znakova"),
  linkAccess: linkAccessSchema.optional(),
});

export const shoppingListDtoSchema = shoppingListRequestSchema.extend({
  id: z.string(),
  ownerId: z.string(),
  // Both owner-only: the server sends null to anyone who arrived through a link, so
  // they cannot reshare the list at a level its owner never granted.
  linkAccess: linkAccessSchema.nullable().optional(),
  shareToken: z.string().nullable().optional(),
  // The caller's resolved access, so the client never re-derives the backend rule.
  myAccess: listAccessSchema,
  updatedAt: z.string(),
  createdAt: z.string(),
  items: z.array(shoppingListItemDtoSchema),
});

// Type exports
export type LinkAccess = z.infer<typeof linkAccessSchema>;
export type ListAccess = z.infer<typeof listAccessSchema>;
export type ShoppingListRequest = z.infer<typeof shoppingListRequestSchema>;
export type ShoppingListDto = z.infer<typeof shoppingListDtoSchema>;
