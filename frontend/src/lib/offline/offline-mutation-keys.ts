import type { Mutation, MutationKey } from "@tanstack/react-query";

// Write-side counterpart to cached-query-keys.ts. Each key must also be attached to
// its mutation hook and registered with a replay function in offline-mutations.ts.
export const OFFLINE_MUTATION_KEYS = {
  shoppingListCreate: ["shoppingLists", "create"],
  shoppingListUpdate: ["shoppingLists", "update"],
  shoppingListDelete: ["shoppingLists", "delete"],
  shoppingListItemAdd: ["shoppingLists", "items", "add"],
  // Ticking items off is the offline case that matters most: it happens in a shop, on a
  // phone, with bad signal. These carry a list someone shared with you as well as your
  // own, since both are reached by the list's id.
  shoppingListItemUpdate: ["shoppingLists", "items", "update"],
  shoppingListItemDelete: ["shoppingLists", "items", "delete"],
  // Card ids are minted client-side, so there are no temp ids to rewrite. Replay order
  // comes from DIGITAL_CARD_MUTATION_SCOPE: mutations sharing a scope run one at a time,
  // while unscoped paused mutations all resume in parallel.
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

/**
 * A card write still in flight, not only a paused one. Every card write is a PUT or
 * DELETE by a client-minted id, so sending one again after a reload is harmless; a list
 * item add is a POST and would be duplicated, so list writes persist only once paused.
 */
export function isInFlightCardWrite(mutation: Mutation) {
  return (
    mutation.state.status === "pending" &&
    mutation.options.scope?.id === DIGITAL_CARD_MUTATION_SCOPE.id
  );
}

// Off-allowlist writes just fail offline, as before.
export function shouldPersistMutation(mutation: Mutation) {
  return (
    isOfflineMutationKey(mutation.options.mutationKey) &&
    (mutation.state.isPaused || isInFlightCardWrite(mutation))
  );
}
