import "server-only";
import { cache } from "react";
import { cijeneApiV1Client, cijeneLatestClient } from "@/lib/cijene-api/client";
import { CijeneApiError } from "@/lib/cijene-api/errors";
import {
  productResponseSchema,
  type ProductResponse,
} from "@/lib/cijene-api/schemas";

export type ServerProductResult =
  | { status: "found"; product: ProductResponse }
  | { status: "missing" }
  | { status: "unavailable" };

/** An outage is kept apart from a 404, so a blip never turns a real product into a not-found page. */
export const getServerProduct = cache(
  async (ean: string): Promise<ServerProductResult> => {
    try {
      const response = await (cijeneLatestClient ?? cijeneApiV1Client).get(
        `/products/${encodeURIComponent(ean)}`,
      );
      return {
        status: "found",
        product: productResponseSchema.parse(response.data),
      };
    } catch (error) {
      if (error instanceof CijeneApiError && error.status === 404) {
        return { status: "missing" };
      }

      return { status: "unavailable" };
    }
  },
);
