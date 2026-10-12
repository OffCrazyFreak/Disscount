/**
 * The `digitalCards` root is allowlisted for offline persistence in
 * lib/offline/cached-query-keys.ts. Photo bytes live in their own idb store and never in
 * a query key under this root.
 *
 * The version segment retires cached data whose shape changed: a blob persisted by an
 * older build restores for up to 7 days, and a new reader would crash on it. Bump it
 * whenever the card DTO changes shape.
 */
export const DIGITAL_CARD_KEY_VERSION = "v2";

export const DIGITAL_CARD_QUERY_KEYS = {
  all: ["digitalCards"] as const,
  me: ["digitalCards", DIGITAL_CARD_KEY_VERSION, "me"] as const,
  config: ["digitalCards", DIGITAL_CARD_KEY_VERSION, "config"] as const,
};
