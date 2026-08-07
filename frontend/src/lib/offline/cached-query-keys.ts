import type { QueryKey } from "@tanstack/react-query";

// Query-key prefixes whose data is persisted to disk; keep in sync with the keys
// in lib/cijene-api and lib/api/*. Gates query dehydration only, not the offline
// mutations persisted separately in persister.ts.
const PERSISTED_QUERY_KEY_PREFIXES = [
  "cijene", // public product / price / store data
  "shoppingLists",
  "shoppingListItems",
  "watchlist",
  "digitalCards",
  "storeNames", // community store-name suggestions, so the card form works offline
  "pinnedStores",
  "pinnedPlaces",
  "users", // current user profile (["users", "me"])
] as const;

type PersistedQueryKeyPrefix = (typeof PERSISTED_QUERY_KEY_PREFIXES)[number];

export function shouldPersistQuery(queryKey: QueryKey): boolean {
  const root = queryKey[0];

  if (root === "cijene" && queryKey[1] === "prices") {
    return queryKey[2] === "product";
  }

  return (
    typeof root === "string" &&
    PERSISTED_QUERY_KEY_PREFIXES.includes(root as PersistedQueryKeyPrefix)
  );
}
