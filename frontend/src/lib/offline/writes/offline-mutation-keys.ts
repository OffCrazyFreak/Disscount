import type { Mutation, MutationKey } from "@tanstack/react-query";

// Each key must also be attached to its mutation hook and registered with a replay function in offline-mutations.ts.
export const OFFLINE_MUTATION_KEYS = {
  shoppingListCreate: ["shoppingLists", "create"],
  shoppingListUpdate: ["shoppingLists", "update"],
  shoppingListDelete: ["shoppingLists", "delete"],
  shoppingListItemAdd: ["shoppingLists", "items", "add"],
  // Ticking off matters most offline: in a shop, with bad signal; shared lists are reached by id too.
  shoppingListItemUpdate: ["shoppingLists", "items", "update"],
  shoppingListItemDelete: ["shoppingLists", "items", "delete"],
  // Client-minted ids need no rewriting; DIGITAL_CARD_MUTATION_SCOPE runs these one at a time.
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

/** Card writes resend harmlessly by client-minted id; a list add is a POST, so lists persist once paused. */
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
