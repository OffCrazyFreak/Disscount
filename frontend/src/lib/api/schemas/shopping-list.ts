import { z } from "zod";
import { shoppingListItemDtoSchema } from "@/lib/api/schemas/shopping-list-item";

// OWNER is only ever a resolved answer, never a level the owner can pick, so it is absent here and present in listAccessSchema.
const linkAccessSchema = z.enum(["NONE", "VIEW", "SHOP", "EDIT"]);
const listAccessSchema = z.enum(["NONE", "VIEW", "SHOP", "EDIT", "OWNER"]);

export const shoppingListRequestSchema = z.object({
  // Trimmed before the length checks, so three spaces cannot pass min(3) and reach the backend as a blank title its @NotBlank rejects.
  title: z
    .string()
    .trim()
    .min(3, "shoppingLists.validation.titleMin")
    .max(100, "shoppingLists.validation.titleMax"),
  linkAccess: linkAccessSchema.optional(),
});

// Its own object, because the request's title rules are form validation the backend does not enforce, and a valid response must parse.
export const shoppingListDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  // Owner-only, like the two below, because an account id is stable and a share link can travel anywhere.
  ownerId: z.string().nullable(),
  // The server sends null to link visitors, so they cannot reshare the list at a level its owner never granted.
  linkAccess: linkAccessSchema.nullable(),
  // The caller's resolved access, so the client never re-derives the backend rule.
  myAccess: listAccessSchema,
  updatedAt: z.string(),
  createdAt: z.string(),
  items: z.array(shoppingListItemDtoSchema),
});

/** Independent flags, so a copy can take the products without the shopping progress. */
export const shoppingListCopyRequestSchema = z.object({
  // Trimmed before the length checks, so three spaces cannot pass min(3) and reach the backend as a blank title its @NotBlank rejects.
  title: z
    .string()
    .trim()
    .min(3, "shoppingLists.validation.titleMin")
    .max(100, "shoppingLists.validation.titleMax"),
  includeItems: z.boolean(),
  includeProgress: z.boolean(),
  includeSharing: z.boolean(),
});

export type LinkAccess = z.infer<typeof linkAccessSchema>;
export type ListAccess = z.infer<typeof listAccessSchema>;

export type ShoppingListRequest = z.infer<typeof shoppingListRequestSchema>;
export type ShoppingListCopyRequest = z.infer<
  typeof shoppingListCopyRequestSchema
>;
export type ShoppingListDto = z.infer<typeof shoppingListDtoSchema>;
