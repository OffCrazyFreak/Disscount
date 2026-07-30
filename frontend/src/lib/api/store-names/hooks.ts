import { useQuery } from "@tanstack/react-query";

import { StoreNameSuggestion } from "@/lib/api/types";
import { getStoreNameSuggestions } from "@/lib/api/store-names/queries";

export function useGetStoreNameSuggestions({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery<StoreNameSuggestion[], Error>({
    queryKey: ["storeNames", "suggestions"],
    queryFn: getStoreNameSuggestions,
    enabled,
  });
}
