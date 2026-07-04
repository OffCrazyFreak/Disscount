import type { Mutation, MutationKey } from "@tanstack/react-query";

// Mutation keys for writes allowed to queue while offline and replay on
// reconnect. Parallel to the read whitelist in cached-query-keys.ts — keep the
// keys here as the single source of truth, attach them to the matching
// useMutation hooks, and register their replay functions in offline-mutations.ts.
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

// Only paused mutations on the allowlist are persisted (and later replayed) —
// other writes simply fail offline as before.
export function shouldPersistMutation(mutation: Mutation) {
  return isOfflineMutationKey(mutation.options.mutationKey);
}
