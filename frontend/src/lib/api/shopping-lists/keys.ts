/**
 * The `shoppingLists` and `shoppingListItems` roots are allowlisted for offline
 * persistence in lib/offline/cached-query-keys.ts. Renaming a root here without
 * renaming it there silently stops the data being written to IndexedDB.
 *
 * There is deliberately no separate root for lists reached by a share link. One used to
 * exist, on the grounds that someone else's list is not one of yours and should not appear
 * in owner-scoped invalidations. Sharing is now by the list's own id, so `byId` is the only
 * key either way and those invalidations reach a visitor's copy too, which is correct: it
 * is the same list. The privacy half of that old argument still holds, through the
 * per-identity store in lib/offline/cache-identity.ts, not through the key.
 */
export const SHOPPING_LIST_QUERY_KEYS = {
  all: ["shoppingLists"] as const,
  me: ["shoppingLists", "me"] as const,
  byId: (id: string) => ["shoppingLists", id] as const,
  itemsAll: ["shoppingListItems"] as const,
  myItems: ["shoppingListItems", "me"] as const,
};
