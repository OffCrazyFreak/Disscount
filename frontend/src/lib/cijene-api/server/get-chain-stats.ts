import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { cijeneApiV1Client } from "@/lib/cijene-api/client";
import {
  chainStatsResponseSchema,
  type ChainStats,
} from "@/lib/cijene-api/schemas";
import { SERVER_LOOKUP_REVALIDATE_SECONDS } from "@/lib/cijene-api/server/server-lookup-cache";

// Throws on an outage, and a rejected lookup is never stored for the hour.
const lookUpCachedChainStats = unstable_cache(
  async (): Promise<ChainStats[]> => {
    const response = await cijeneApiV1Client.get("/chain-stats/");

    return chainStatsResponseSchema.parse(response.data).chain_stats;
  },
  ["cijene-server-chain-stats"],
  { revalidate: SERVER_LOOKUP_REVALIDATE_SECONDS },
);

/** One upstream call an hour serves every chain hub; null on an outage, since store facts come from our own data. */
export const getServerChainStats = cache(
  async (): Promise<ChainStats[] | null> => {
    try {
      return await lookUpCachedChainStats();
    } catch (error) {
      console.warn("[chains] chain stats unavailable", error);

      return null;
    }
  },
);
