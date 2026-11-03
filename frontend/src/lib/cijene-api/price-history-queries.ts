import { queryOptions } from "@tanstack/react-query";

import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import { getProductByEan } from "@/lib/cijene-api/queries";

// Product and shopping list charts share these cache entries, so both build
// them here to keep the key and staleTime identical.
export function priceHistoryQueries(ean: string, dates: string[]) {
  return dates.map((date, index) =>
    queryOptions({
      queryKey: CIJENE_QUERY_KEYS.priceHistory(ean, date),
      queryFn: () => getProductByEan({ ean, date }),
      enabled: !!ean,
      staleTime:
        index === 0 || index === dates.length - 1
          ? 60 * 1000
          : 6 * 60 * 60 * 1000,
    }),
  );
}
