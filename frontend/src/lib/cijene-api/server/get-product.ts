import "server-only";
import { cache } from "react";
import { cijeneApiV1Client } from "@/lib/cijene-api/client";
import { CijeneApiError } from "@/lib/cijene-api/errors";
import {
  productResponseSchema,
  type ProductResponse,
} from "@/lib/cijene-api/schemas";

type ServerLookup<TProduct> =
  | { status: "found"; product: TProduct }
  | { status: "missing" }
  | { status: "unavailable" };

export type ServerProductResult = ServerLookup<ProductResponse>;

/** An outage is kept apart from a 404, so a blip never turns a real product into a not-found page. */
export const getServerProductData = cache(
  async (ean: string): Promise<ServerLookup<unknown>> => {
    try {
      const response = await cijeneApiV1Client.get(
        `/products/${encodeURIComponent(ean)}`,
      );

      return { status: "found", product: response.data };
    } catch (error) {
      if (error instanceof CijeneApiError && error.status === 404) {
        return { status: "missing" };
      }

      return { status: "unavailable" };
    }
  },
);

export const getServerProduct = cache(
  async (ean: string): Promise<ServerProductResult> => {
    const result = await getServerProductData(ean);
    if (result.status !== "found") return result;

    const parsed = productResponseSchema.safeParse(result.product);

    return parsed.success
      ? { status: "found", product: parsed.data }
      : { status: "unavailable" };
  },
);
