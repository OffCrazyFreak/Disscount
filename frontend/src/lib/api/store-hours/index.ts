import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { StoreHoursResponse, storeHoursResponse } from "@/lib/api/schemas";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";

async function getStoreHours(): Promise<StoreHoursResponse> {
  const response = await axios.get("/api/cijene/store-hours");

  return storeHoursResponse.parse(response.data);
}

// Under the "cijene" root so the hours persist offline; the status function
// turns them unconfirmed by itself once they are two weeks old.
export function useStoreHours({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    enabled,
    queryKey: CIJENE_QUERY_KEYS.storeHours,
    queryFn: getStoreHours,
    staleTime: 60 * 60 * 1000,
  });
}
