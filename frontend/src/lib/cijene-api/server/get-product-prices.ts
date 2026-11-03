import "server-only";
import { cache } from "react";
import { cijeneApiV1Client } from "@/lib/cijene-api/client";
import {
  getPricesParamsSchema,
  storePricesResponseSchema,
  type StorePricesResponse,
} from "@/lib/cijene-api/schemas";
import { buildQueryString } from "@/utils/generic";

/**
 * Every store's price for one product, once per request. Null on any failure, so the
 * page still renders and the browser fetches the prices itself.
 */
export const getServerProductPrices = cache(
  async (ean: string): Promise<StorePricesResponse | null> => {
    try {
      const response = await cijeneApiV1Client.get(
        `/prices?${buildQueryString(getPricesParamsSchema.parse({ eans: ean }))}`,
      );
      return storePricesResponseSchema.parse(response.data);
    } catch {
      return null;
    }
  },
);
