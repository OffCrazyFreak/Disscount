// The `users` root is allowlisted for offline persistence in lib/offline/cached-query-keys.ts.
export const USER_QUERY_KEYS = {
  me: ["users", "me"] as const,
};
