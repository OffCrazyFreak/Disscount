import type { Mutation, MutationKey } from "@tanstack/react-query";

// Each key must also be attached to its mutation hook and registered with a replay function in offline-mutations.ts.
export const OFFLINE_MUTATION_KEYS = {
  shoppingListCreate: ["shoppingLists", "create"],
  shoppingListUpdate: ["shoppingLists", "update"],
  shoppingListDelete: ["shoppingLists", "delete"],
  shoppingListItemAdd: ["shoppingLists", "items", "add"],
  // Ticking items off is the offline case that matters most: in a shop, on a phone, with bad signal; shared lists are reached by id too.
  shoppingListItemUpdate: ["shoppingLists", "items", "update"],
  shoppingListItemDelete: ["shoppingLists", "items", "delete"],
  // Card ids are minted client-side, so no temp ids to rewrite; mutations sharing DIGITAL_CARD_MUTATION_SCOPE run one at a time.
  digitalCardSave: ["digitalCards", "save"],
  digitalCardDelete: ["digitalCards", "delete"],
  digitalCardPin: ["digitalCards", "pin"],
  digitalCardArchive: ["digitalCards", "archive"],
  watchlistAdd: ["watchlist", "add"],
  watchlistRemove: ["watchlist", "remove"],
} as const satisfies Record<string, MutationKey>;

export const DIGITAL_CARD_MUTATION_SCOPE = { id: "digitalCards" };

const OFFLINE_MUTATION_KEY_HASHES = new Set(
  Object.values(OFFLINE_MUTATION_KEYS).map((key) => JSON.stringify(key)),
);

export function isOfflineMutationKey(mutationKey: MutationKey | undefined) {
  return mutationKey !== undefined
    ? OFFLINE_MUTATION_KEY_HASHES.has(JSON.stringify(mutationKey))
    : false;
}

/** Card writes are PUT or DELETE by a client-minted id, so resending is harmless; a list item add is a POST, so lists persist only once paused. */
export function isInFlightCardWrite(mutation: Mutation) {
  return (
    mutation.state.status === "pending" &&
    mutation.options.scope?.id === DIGITAL_CARD_MUTATION_SCOPE.id
  );
}

// Off-allowlist writes just fail offline.
export function shouldPersistMutation(mutation: Mutation) {
  return (
    isOfflineMutationKey(mutation.options.mutationKey) &&
    (mutation.state.isPaused || isInFlightCardWrite(mutation))
  );
}
