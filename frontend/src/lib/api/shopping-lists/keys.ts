/**
 * The `shoppingLists` and `shoppingListItems` roots are allowlisted for offline
 * persistence in lib/offline/cached-query-keys.ts. Renaming a root here without
 * renaming it there silently stops the data being written to IndexedDB.
 */
export const SHOPPING_LIST_QUERY_KEYS = {
  all: ["shoppingLists"] as const,
  me: ["shoppingLists", "me"] as const,
  byId: (id: string) => ["shoppingLists", id] as const,
  itemsAll: ["shoppingListItems"] as const,
  myItems: ["shoppingListItems", "me"] as const,
};
