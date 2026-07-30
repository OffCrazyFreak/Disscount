/**
 * The `watchlist` root is allowlisted for offline persistence in
 * lib/offline/cached-query-keys.ts, so it has to stay spelled that way.
 */
export const WATCHLIST_QUERY_KEYS = {
  all: ["watchlist"] as const,
  me: ["watchlist", "me"] as const,
  byProduct: (productApiId: string) =>
    ["watchlist", "product", productApiId] as const,
};
