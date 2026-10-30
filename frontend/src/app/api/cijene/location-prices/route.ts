import { NextRequest } from "next/server";
import { z } from "zod";
import { cijeneApiV1Client } from "@/lib/cijene-api/client";
import {
  locationPricesResponseSchema,
  storePricesResponseSchema,
} from "@/lib/cijene-api/schemas";
import { createPriceCache } from "@/lib/cijene-api/location-prices/price-cache";
import { loadLocationPrices } from "@/lib/cijene-api/location-prices/load-location-prices";
import { createApiError } from "@/lib/cijene-api/utils/response-utils";
import { withCijeneRoute } from "@/lib/cijene-api/utils/with-cijene-route";
import { buildQueryString, readListParam } from "@/utils/generic";

// Upstream publishes prices once a day, so an hour old is still current.
const priceCache = createPriceCache({
  ttlMs: 60 * 60 * 1000,
  maxEntries: 5_000,
});

const paramsSchema = z.object({
  eans: z.string().min(1),
  chains: z.string().min(1),
  cities: z.array(z.string()).min(1).max(1000),
});

/**
 * Price range per product across many cities, in one response. Upstream takes
 * one city per request, so this route decides how to spend requests on it.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Sorted, so the same search always lands on the same cache entries.
  const parsed = paramsSchema.safeParse({
    eans: readListParam(searchParams, "eans", { legacyCsv: true })
      .sort()
      .join(","),
    chains: readListParam(searchParams, "chains", { legacyCsv: true })
      .sort()
      .join(","),
    cities: readListParam(searchParams, "city"),
  });

  if (!parsed.success) {
    return createApiError("Invalid parameters for location prices", {
      status: 400,
      details: z.treeifyError(parsed.error),
    });
  }

  const { eans, chains, cities } = parsed.data;

  async function fetchStorePrices(city?: string) {
    const response = await cijeneApiV1Client.get(
      `/prices?${buildQueryString({ eans, chains, city })}`,
    );

    return storePricesResponseSchema.parse(response.data).store_prices;
  }

  return withCijeneRoute(
    "location prices",
    locationPricesResponseSchema,
    async () => ({
      data: await loadLocationPrices(
        { eans, chains, cities },
        fetchStorePrices,
        priceCache,
      ),
    }),
  );
}
