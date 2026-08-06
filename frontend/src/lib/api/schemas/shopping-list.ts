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

// Its own object rather than an extension of the request schema. The request's title
// rules are form validation, which the backend does not enforce, so inheriting them here
// would make a response the server considers valid fail to parse.
export const shoppingListDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  // Owner-only, like the two below: an account id is a stable identifier and a share
  // link can travel anywhere.
  ownerId: z.string().nullable().optional(),
  // The server sends null to anyone who arrived through a link, so they cannot reshare
  // the list at a level its owner never granted.
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
