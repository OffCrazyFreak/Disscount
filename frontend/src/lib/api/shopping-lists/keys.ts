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
   * Its own root rather than a branch of `shoppingLists`, because a list reached by token
   * is not one of yours: it must not appear in the owner-scoped invalidations, and it has
   * its own persistence and purge story. See lib/offline/cache-identity.ts, which is what
   * makes persisting someone else's list acceptable.
   */
  sharedRoot: ["sharedShoppingList"] as const,
  byToken: (token: string) => ["sharedShoppingList", token] as const,
};
