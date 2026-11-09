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

// Under the "cijene" root so the hours persist offline; the status function turns them unconfirmed once two weeks old.
export function useStoreHours({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    enabled,
    queryKey: CIJENE_QUERY_KEYS.storeHours,
    queryFn: getStoreHours,
    // The cache keeps the compact form because the persister rewrites the whole cache as JSON on every save.
    select: decodeStoreHours,
    // Only a set the server marks complete is kept for the hour; anything else is asked again.
    staleTime: ({ state }) => (state.data?.complete ? 60 * 60 * 1000 : 0),
  });
}
