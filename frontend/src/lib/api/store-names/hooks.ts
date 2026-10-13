import { useQuery } from "@tanstack/react-query";

import { STORE_NAME_QUERY_KEYS } from "@/lib/api/store-names/keys";
import { searchStoreNames } from "@/lib/api/store-names/queries";
import type { StoreNameSuggestionDto } from "@/lib/api/types";

/** Debouncing the input is the caller's job. */
export function useSearchStoreNames(query: string) {
  return useQuery<StoreNameSuggestionDto[], Error>({
    queryKey: STORE_NAME_QUERY_KEYS.search(query),
    queryFn: () => searchStoreNames(query),
    enabled: query.length >= 1,
    staleTime: 5 * 60_000,
  });
}
