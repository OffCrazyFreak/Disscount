import { NextRequest } from "next/server";
import { z } from "zod";
import { cijeneApiV1Client } from "@/lib/cijene-api/client";
import {
  getProductParamsSchema,
  productResponseSchema,
} from "@/lib/cijene-api/schemas";
import { createApiError } from "@/lib/cijene-api/utils/response-utils";
import { withCijeneRoute } from "@/lib/cijene-api/utils/with-cijene-route";
import { buildQueryString } from "@/utils/generic";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/cijene/products/[ean]">,
) {
  const { ean } = await context.params;
  const { searchParams } = new URL(request.url);

  const parsed = getProductParamsSchema.safeParse({
    ean: ean.trim(),
    date: searchParams.get("date") || undefined,
    chains: searchParams.get("chains") || undefined,
  });

  if (!parsed.success) {
    return createApiError("Invalid parameters for product", {
      status: 400,
      details: z.treeifyError(parsed.error),
    });
  }

  const { ean: validEan, ...filters } = parsed.data;
  const queryString = buildQueryString(filters);

  return withCijeneRoute("product", productResponseSchema, () =>
    cijeneApiV1Client.get(
      `/products/${encodeURIComponent(validEan)}${
        queryString && `?${queryString}`
      }`,
    ),
  );
}
