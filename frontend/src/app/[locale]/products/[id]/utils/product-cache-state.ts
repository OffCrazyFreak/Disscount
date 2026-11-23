import "server-only";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import type {
  ProductResponse,
  StorePricesResponse,
} from "@/lib/cijene-api/schemas";
import type { FetchedLookup } from "@/lib/cijene-api/server/server-lookup-cache";

/** Keyed by the raw route segment the client queries with, so hydration needs no second fetch. */
export function productCacheState(
  routeEan: string,
  product: FetchedLookup<ProductResponse>,
  prices: FetchedLookup<StorePricesResponse> | null,
) {
  const queryClient = new QueryClient();

  // The fetch time, not now, so a stale server copy is refetched by the browser.
  queryClient.setQueryData(
    CIJENE_QUERY_KEYS.productByEan(routeEan),
    product.data,
    { updatedAt: product.fetchedAt },
  );

  if (prices) {
    queryClient.setQueryData(
      CIJENE_QUERY_KEYS.productStorePrices({ eans: routeEan }),
      prices.data,
      { updatedAt: prices.fetchedAt },
    );
  }

  return dehydrate(queryClient);
}
