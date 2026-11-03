// Both roots are allowlisted for offline persistence in lib/offline/cached-query-keys.ts.
export const PREFERENCE_QUERY_KEYS = {
  pinnedStores: ["pinnedStores"] as const,
  pinnedPlaces: ["pinnedPlaces"] as const,
};
