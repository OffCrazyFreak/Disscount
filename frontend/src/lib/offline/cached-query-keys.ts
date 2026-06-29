import type { QueryKey } from "@tanstack/react-query";

// Top-level query-key prefixes whose data we persist to IndexedDB for offline
// use. Single source of truth — keep in sync with the query keys defined in
// lib/cijene-api and lib/api/*. Anything not listed here is never written to
// disk (e.g. admin data).
const PERSISTED_QUERY_KEY_PREFIXES = [
  "cijene", // public product / price / store data
  "shoppingLists",
  "shoppingListItems",
  "watchlist",
  "digitalCards",
  "pinnedStores",
  "pinnedPlaces",
  "users", // current user profile (["users", "me"])
  // TODO(offline): add keys for coming-soon features when they ship —
  //   potrošnja (/spending), novosti (/updates), karta (/map).
] as const;

type PersistedQueryKeyPrefix = (typeof PERSISTED_QUERY_KEY_PREFIXES)[number];

export function shouldPersistQuery(queryKey: QueryKey): boolean {
  const root = queryKey[0];

  return (
    typeof root === "string" &&
    PERSISTED_QUERY_KEY_PREFIXES.includes(root as PersistedQueryKeyPrefix)
  );
}
