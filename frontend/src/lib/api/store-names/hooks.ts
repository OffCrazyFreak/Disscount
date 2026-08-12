import { useQuery } from "@tanstack/react-query";

import { StoreNameSuggestion } from "@/lib/api/types";
import { getStoreNameSuggestions } from "@/lib/api/store-names/queries";
import { STORE_NAME_QUERY_KEYS } from "@/lib/api/store-names/keys";

export function useGetStoreNameSuggestions({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery<StoreNameSuggestion[], Error>({
    queryKey: STORE_NAME_QUERY_KEYS.suggestions,
    queryFn: getStoreNameSuggestions,
    enabled,
  });
}
