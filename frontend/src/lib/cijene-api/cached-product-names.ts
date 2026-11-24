import type { QueryClient } from "@tanstack/react-query";

import type {
  ProductResponse,
  ProductSearchResponse,
} from "@/lib/cijene-api/schemas";

// normalizeCached keeps 8192 entries, so scoring a larger pool on every key would churn it.
const MAX_CACHED_PRODUCT_NAMES = 1000;

function namesIn(
  queryKey: readonly unknown[],
  data: unknown,
): (string | null)[] {
  if (queryKey[1] === "products" && queryKey[2] === "search") {
    return (data as ProductSearchResponse).products.map(({ name }) => name);
  }
  if (queryKey[1] === "product" && queryKey[2] === "ean") {
    return [(data as ProductResponse).name];
  }
  return [];
}

/** Names of the products this device already loaded, latest first. No network. */
export function getCachedProductNames(queryClient: QueryClient): string[] {
  const queries = queryClient
    .getQueryCache()
    .findAll({ queryKey: ["cijene"] })
    .filter((query) => query.state.data !== undefined)
    .sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt);

  const names = new Set<string>();

  for (const query of queries) {
    for (const name of namesIn(query.queryKey, query.state.data)) {
      if (name) names.add(name);
      if (names.size === MAX_CACHED_PRODUCT_NAMES) return [...names];
    }
  }

  return [...names];
}
