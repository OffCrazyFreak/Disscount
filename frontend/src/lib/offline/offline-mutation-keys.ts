import type { Mutation, MutationKey } from "@tanstack/react-query";

// Write-side counterpart to cached-query-keys.ts; replays live in offline-mutations.ts.
export const OFFLINE_MUTATION_KEYS = {
  shoppingListCreate: ["shoppingLists", "create"],
  shoppingListUpdate: ["shoppingLists", "update"],
  shoppingListDelete: ["shoppingLists", "delete"],
  shoppingListItemAdd: ["shoppingLists", "items", "add"],
  shoppingListItemUpdate: ["shoppingLists", "items", "update"],
  shoppingListItemDelete: ["shoppingLists", "items", "delete"],
  watchlistAdd: ["watchlist", "add"],
  watchlistRemove: ["watchlist", "remove"],
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
