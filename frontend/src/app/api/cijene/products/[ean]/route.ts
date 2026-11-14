import { NextRequest } from "next/server";
import { proxyProblem } from "@/lib/backend-proxy/proxy-problem";
import { cijeneApiV1Client, cijeneLatestClient } from "@/lib/cijene-api/client";
import {
  getProductParamsSchema,
  productResponseSchema,
} from "@/lib/cijene-api/schemas";
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
    return proxyProblem("bad_request", request);
  }

  const { ean: validEan, ...filters } = parsed.data;
  const queryString = buildQueryString(filters);

  return withCijeneRoute(request, "product", productResponseSchema, () =>
    (filters.date
      ? cijeneApiV1Client
      : (cijeneLatestClient ?? cijeneApiV1Client)
    ).get(
      `/products/${encodeURIComponent(validEan)}${
        queryString && `?${queryString}`
      }`,
    ),
  );
}
