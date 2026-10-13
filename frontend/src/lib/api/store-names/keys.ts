export const STORE_NAME_QUERY_KEYS = {
  all: ["storeNames"] as const,
  search: (query: string) => ["storeNames", "search", query] as const,
};
