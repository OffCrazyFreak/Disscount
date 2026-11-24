export const ACCOUNT_SESSION_QUERY_KEYS = {
  all: ["account-sessions"] as const,
  // Keyed on this device's session, because a re-auth proof swaps it for a new id.
  list: (currentSessionId: string | undefined) =>
    ["account-sessions", currentSessionId] as const,
};
