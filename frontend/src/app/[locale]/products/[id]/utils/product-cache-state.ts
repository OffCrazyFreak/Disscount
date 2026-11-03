import "server-only";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import {
  productByEanQueryKey,
  productStorePricesQueryKey,
} from "@/lib/cijene-api/query-hooks";
import type {
  ProductResponse,
  StorePricesResponse,
} from "@/lib/cijene-api/schemas";

/**
 * The server's product and prices as React Query cache entries, keyed by the raw route
 * segment the client queries with, so hydration needs no second fetch.
 */
export function productCacheState(
  routeEan: string,
  product: ProductResponse,
  prices: StorePricesResponse | null,
) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(productByEanQueryKey(routeEan), product);

  if (prices) {
    queryClient.setQueryData(
      productStorePricesQueryKey({ eans: routeEan }),
      prices,
    );
  }

  return dehydrate(queryClient);
}
