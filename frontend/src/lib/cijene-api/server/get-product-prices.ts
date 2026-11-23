import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { cijeneApiV1Client } from "@/lib/cijene-api/client";
import {
  getPricesParamsSchema,
  storePricesResponseSchema,
  type StorePricesResponse,
} from "@/lib/cijene-api/schemas";
import {
  SERVER_LOOKUP_REVALIDATE_SECONDS,
  type FetchedLookup,
} from "@/lib/cijene-api/server/server-lookup-cache";
import { buildQueryString } from "@/utils/format/generic";

const SERVER_PRICES_TIMEOUT_MS = 5000;

// A failure or a bad shape throws and is never stored, so one timeout does not hide prices for an hour.
const lookUpCachedPrices = unstable_cache(
  async (ean: string): Promise<FetchedLookup<StorePricesResponse>> => {
    const response = await cijeneApiV1Client.get(
      `/prices?${buildQueryString(getPricesParamsSchema.parse({ eans: ean }))}`,
      // The page waits for this before sending HTML, and the browser can fetch it instead.
      { timeout: SERVER_PRICES_TIMEOUT_MS },
    );

    return {
      data: storePricesResponseSchema.parse(response.data),
      fetchedAt: Date.now(),
    };
  },
  ["cijene-server-product-prices"],
  { revalidate: SERVER_LOOKUP_REVALIDATE_SECONDS },
);

/** Null on any failure, so the page still renders and the browser fetches the prices itself. */
export const getServerProductPrices = cache(
  async (ean: string): Promise<FetchedLookup<StorePricesResponse> | null> => {
    try {
      return await lookUpCachedPrices(ean);
    } catch {
      return null;
    }
  },
);
