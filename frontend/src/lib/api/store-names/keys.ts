/**
 * The `storeNames` root is allowlisted for offline persistence in
 * lib/offline/cached-query-keys.ts, so the card form's autocomplete still offers the
 * community names with no signal. Renaming it here without renaming it there silently
 * stops that being written to IndexedDB.
 */
export const STORE_NAME_QUERY_KEYS = {
  all: ["storeNames"] as const,
  suggestions: ["storeNames", "suggestions"] as const,
};
