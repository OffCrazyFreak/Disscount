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

  /**
   * Deliberately NOT under the `shoppingLists` root, so it is never persisted. The
   * IndexedDB cache is a single browser-wide store and purgeOfflineCache only runs on a
   * logout transition, so a visitor who never logs in never purges: a persisted shared
   * list would sit on a stranger's disk for the seven-day cache lifetime.
   */
  byToken: (token: string) => ["sharedShoppingList", token] as const,
};
