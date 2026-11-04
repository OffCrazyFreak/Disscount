import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import {
  CompactStoreHoursResponse,
  compactStoreHoursResponse,
} from "@/lib/api/schemas";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import { decodeStoreHours } from "@/lib/store-hours/compact-store-hours";

async function getStoreHours(): Promise<CompactStoreHoursResponse> {
  const response = await axios.get("/api/cijene/store-hours");

  return compactStoreHoursResponse.parse(response.data);
}

// Under the "cijene" root so the hours persist offline; the status function
// turns them unconfirmed by itself once they are two weeks old.
export function useStoreHours({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    enabled,
    queryKey: CIJENE_QUERY_KEYS.storeHours,
    queryFn: getStoreHours,
    // The cache keeps the compact form because the persister rewrites the whole
    // cache as JSON on every save; a module-level select runs once per new data.
    select: decodeStoreHours,
    staleTime: 60 * 60 * 1000,
  });
}
