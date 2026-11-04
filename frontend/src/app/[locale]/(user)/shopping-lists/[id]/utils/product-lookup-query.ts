import { queryOptions } from "@tanstack/react-query";

import cijeneService from "@/lib/cijene-api";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import { isProductNotFound } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/item-price-state";

function isNotKnownMissing(query: { state: { error: unknown } }) {
  return !isProductNotFound(query.state.error);
}

/** Both observers on this page share these options, since TanStack refetches through whichever allows it; useShoppingListData covers the watchlist's refetches. */
export function productLookupQuery(ean: string) {
  return queryOptions({
    queryKey: CIJENE_QUERY_KEYS.productByEan(ean),
    queryFn: () => cijeneService.getProductByEan({ ean }),
    staleTime: 6 * 60 * 60 * 1000,
    // The app default of one retry, minus a 404, which asking again cannot change.
    retry: (failureCount, error) =>
      !isProductNotFound(error) && failureCount < 1,
    retryOnMount: false,
    refetchOnWindowFocus: isNotKnownMissing,
    refetchOnReconnect: isNotKnownMissing,
  });
}
