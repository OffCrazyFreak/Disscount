import type { QueryKey } from "@tanstack/react-query";

import { DIGITAL_CARD_KEY_VERSION } from "@/lib/api/digital-cards/keys";

// Query-key prefixes whose data is persisted to disk; keep in sync with the keys
// in lib/cijene-api and lib/api/*. Gates query dehydration only, not the offline
// mutations persisted separately in persister.ts.
const PERSISTED_QUERY_KEY_PREFIXES = [
  "cijene", // public product / price / store data
  "shoppingLists",
  "shoppingListItems",
  "watchlist",
  "digitalCards", // metadata only; photo bytes live in card-photo-store.ts
  "pinnedStores",
  "pinnedPlaces",
  "favoriteStores",
  "users", // current user profile (["users", "me"])
] as const;

type PersistedQueryKeyPrefix = (typeof PERSISTED_QUERY_KEY_PREFIXES)[number];

export function shouldPersistQuery(queryKey: QueryKey): boolean {
  const root = queryKey[0];

  // Image bytes would bloat the single persisted blob; they have their own idb store.
  if (root === "cardPhoto") return false;

  // Older shapes stay out of the next snapshot, so they age out instead of lingering.
  if (root === "digitalCards" && queryKey[1] !== DIGITAL_CARD_KEY_VERSION) {
    return false;
  }

  if (root === "cijene" && queryKey[1] === "prices") {
    return queryKey[2] === "product";
  }

  return (
    typeof root === "string" &&
    PERSISTED_QUERY_KEY_PREFIXES.includes(root as PersistedQueryKeyPrefix)
  );
}
