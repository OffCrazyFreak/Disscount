import "server-only";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import type {
  ProductResponse,
  StorePricesResponse,
} from "@/lib/cijene-api/schemas";

/** Keyed by the raw route segment the client queries with, so hydration needs no second fetch. */
export function productCacheState(
  routeEan: string,
  product: ProductResponse,
  prices: StorePricesResponse | null,
) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(CIJENE_QUERY_KEYS.productByEan(routeEan), product);

  if (prices) {
    queryClient.setQueryData(
      CIJENE_QUERY_KEYS.productStorePrices({ eans: routeEan }),
      prices,
    );
  }

  return dehydrate(queryClient);
}
