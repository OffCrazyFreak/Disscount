import { queryOptions, useQuery } from "@tanstack/react-query";

import {
  StoreDirectoryResponse,
  storeDirectoryResponse,
} from "@/lib/api/schemas";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import cijeneRouteClient from "@/lib/cijene-api/route-client";

async function getStoreDirectory(): Promise<StoreDirectoryResponse> {
  const response = await cijeneRouteClient.get("/api/cijene/store-directory");

  return storeDirectoryResponse.parse(response.data);
}

// Under the "cijene" root so the list persists for offline use like the rest of the public store data.
function storeDirectoryQueryOptions() {
  return queryOptions({
    queryKey: CIJENE_QUERY_KEYS.storeDirectory,
    queryFn: getStoreDirectory,
    staleTime: 60 * 60 * 1000,
  });
}

export function useStoreDirectory({ enabled = true } = {}) {
  return useQuery({ ...storeDirectoryQueryOptions(), enabled });
}
