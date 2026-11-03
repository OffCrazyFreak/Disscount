import { NextRequest } from "next/server";
import { proxyProblem } from "@/lib/backend-proxy/proxy-problem";
import { cijeneApiV1Client } from "@/lib/cijene-api/client";
import {
  listStoresResponseSchema,
  searchStoresParamsSchema,
} from "@/lib/cijene-api/schemas";
import { parseStoreFilterParams } from "@/lib/cijene-api/utils/request-params";
import { withCijeneRoute } from "@/lib/cijene-api/utils/with-cijene-route";
import { buildQueryString } from "@/utils/generic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const parsed = searchStoresParamsSchema.safeParse(
    parseStoreFilterParams(searchParams),
  );

  if (!parsed.success) {
    return proxyProblem("bad_request", request);
  }

  const queryString = buildQueryString(parsed.data);

  return withCijeneRoute(request, "stores", listStoresResponseSchema, () =>
    cijeneApiV1Client.get(`/stores${queryString && `?${queryString}`}`),
  );
}
