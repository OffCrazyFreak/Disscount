/** Admin data is deliberately not offline-persisted. */
export const ADMIN_QUERY_KEYS = {
  all: ["admin"] as const,
  users: ["admin", "users"] as const,
};
