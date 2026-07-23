import type { QueryKey } from "@tanstack/react-query";

// Single source of truth: anything not listed here is never written to disk.
const PERSISTED_QUERY_KEY_PREFIXES = [
  "cijene", // public product / price / store data
  "shoppingLists",
  "shoppingListItems",
  "watchlist",
  "digitalCards",
  "pinnedStores",
  "pinnedPlaces",
  "users", // current user profile (["users", "me"])
  // TODO(offline): add /spending, /updates and /map keys when those ship.
] as const;

type PersistedQueryKeyPrefix = (typeof PERSISTED_QUERY_KEY_PREFIXES)[number];

export function shouldPersistQuery(queryKey: QueryKey): boolean {
  const root = queryKey[0];

  return (
    typeof root === "string" &&
    PERSISTED_QUERY_KEY_PREFIXES.includes(root as PersistedQueryKeyPrefix)
  );
}
