import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { cijeneApiV1Client } from "@/lib/cijene-api/client";
import { createExpiringKeySet } from "@/lib/expiring-key-set";
import { CijeneApiError } from "@/lib/cijene-api/errors";
import {
  productResponseSchema,
  type ProductResponse,
} from "@/lib/cijene-api/schemas";
import {
  SERVER_LOOKUP_REVALIDATE_SECONDS,
  type FetchedLookup,
} from "@/lib/cijene-api/server/server-lookup-cache";

export type ServerProductResult =
  | { status: "found"; product: ProductResponse; fetchedAt: number }
  | { status: "missing" }
  | { status: "unavailable" };

// A miss may be a product upstream adds soon, so it is trusted for minutes rather than the hour a find is.
const missingProducts = createExpiringKeySet(10 * 60 * 1000, 10_000);

// A 404, an outage or a bad shape throws, and a rejected lookup is never stored for the hour.
const lookUpCachedProduct = unstable_cache(
  async (ean: string): Promise<FetchedLookup<ProductResponse>> => {
    const response = await cijeneApiV1Client.get(
      `/products/${encodeURIComponent(ean)}`,
    );

    return {
      data: productResponseSchema.parse(response.data),
      fetchedAt: Date.now(),
    };
  },
  ["cijene-server-product"],
  { revalidate: SERVER_LOOKUP_REVALIDATE_SECONDS },
);

/** An outage is kept apart from a 404, so a blip never turns a real product into a not-found page. */
export const getServerProduct = cache(
  async (ean: string): Promise<ServerProductResult> => {
    if (missingProducts.has(ean)) return { status: "missing" };

    try {
      const { data, fetchedAt } = await lookUpCachedProduct(ean);

      return { status: "found", product: data, fetchedAt };
    } catch (error) {
      if (error instanceof CijeneApiError && error.status === 404) {
        missingProducts.add(ean);
        return { status: "missing" };
      }

      return { status: "unavailable" };
    }
  },
);
