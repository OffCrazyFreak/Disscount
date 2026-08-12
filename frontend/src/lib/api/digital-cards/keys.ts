/**
 * The `digitalCards` root is allowlisted for offline persistence in
 * lib/offline/cached-query-keys.ts. Renaming it here without renaming it there silently
 * stops the wallet being written to IndexedDB, which is the one place it has to work.
 */
export const DIGITAL_CARD_QUERY_KEYS = {
  all: ["digitalCards"] as const,
  me: ["digitalCards", "me"] as const,
};
