import { queryOptions } from "@tanstack/react-query";

import cijeneService from "@/lib/cijene-api";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import { isProductNotFound } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/item-price-state";

function isNotKnownMissing(query: { state: { error: unknown } }) {
  return !isProductNotFound(query.state.error);
}

/**
 * One set of options for both observers of a list's lookups on this page, since TanStack
 * refetches through whichever observer allows it: a 404 is never asked again, and any other
 * failure waits for the retry button or the next window focus. Observers elsewhere (the watchlist) can still refetch,
 * which is why useShoppingListData remembers each lookup's last answer.
 */
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
