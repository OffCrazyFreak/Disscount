/**
 * The `digitalCards` root is allowlisted for offline persistence in
 * lib/offline/cached-query-keys.ts. Photo bytes live in their own idb store and never in
 * a query key under this root.
 */
export const DIGITAL_CARD_QUERY_KEYS = {
  all: ["digitalCards"] as const,
  me: ["digitalCards", "me"] as const,
  config: ["digitalCards", "config"] as const,
};
