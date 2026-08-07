import type { Mutation, MutationKey } from "@tanstack/react-query";

// Write-side counterpart to cached-query-keys.ts. Each key must also be attached to
// its mutation hook and registered with a replay function in offline-mutations.ts.
export const OFFLINE_MUTATION_KEYS = {
  shoppingListCreate: ["shoppingLists", "create"],
  shoppingListUpdate: ["shoppingLists", "update"],
  shoppingListDelete: ["shoppingLists", "delete"],
  shoppingListItemAdd: ["shoppingLists", "items", "add"],
  shoppingListItemUpdate: ["shoppingLists", "items", "update"],
  shoppingListItemDelete: ["shoppingLists", "items", "delete"],
  watchlistAdd: ["watchlist", "add"],
  watchlistRemove: ["watchlist", "remove"],
  // Ticking items off a list someone shared with you is the offline case that matters
  // most: it happens in a shop, on a phone, with bad signal.
  sharedItemUpdate: ["sharedShoppingList", "items", "update"],
  sharedItemDelete: ["sharedShoppingList", "items", "delete"],
  // A wallet is used in the same place, so its writes queue too.
  digitalCardCreate: ["digitalCards", "create"],
  digitalCardUpdate: ["digitalCards", "update"],
  digitalCardDelete: ["digitalCards", "delete"],
  digitalCardSetPinned: ["digitalCards", "setPinned"],
} as const satisfies Record<string, MutationKey>;

const OFFLINE_MUTATION_KEY_HASHES = new Set(
  Object.values(OFFLINE_MUTATION_KEYS).map((key) => JSON.stringify(key)),
);

export function isOfflineMutationKey(mutationKey: MutationKey | undefined) {
  return mutationKey !== undefined
    ? OFFLINE_MUTATION_KEY_HASHES.has(JSON.stringify(mutationKey))
    : false;
}

// Off-allowlist writes just fail offline, as before.
export function shouldPersistMutation(mutation: Mutation) {
  return isOfflineMutationKey(mutation.options.mutationKey);
}
