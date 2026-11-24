/** Renaming a root without cached-query-keys.ts silently stops persistence. */
export const SHOPPING_LIST_QUERY_KEYS = {
  all: ["shoppingLists"] as const,
  me: ["shoppingLists", "me"] as const,
  byId: (id: string) => ["shoppingLists", id] as const,
  itemsAll: ["shoppingListItems"] as const,
  myItems: ["shoppingListItems", "me"] as const,
};
