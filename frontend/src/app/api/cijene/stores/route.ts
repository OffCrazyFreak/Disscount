import { NextRequest } from "next/server";
import { z } from "zod";
import { cijeneApiV1Client } from "@/lib/cijene-api/client";
import {
  listStoresResponseSchema,
  searchStoresParamsSchema,
} from "@/lib/cijene-api/schemas";
import { createApiError } from "@/lib/cijene-api/utils/response-utils";
import { parseStoreFilterParams } from "@/lib/cijene-api/utils/request-params";
import { withCijeneRoute } from "@/lib/cijene-api/utils/with-cijene-route";
import { buildQueryString } from "@/utils/generic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const parsed = searchStoresParamsSchema.safeParse(
    parseStoreFilterParams(searchParams),
  );

  if (!parsed.success) {
    return createApiError("Invalid search parameters", {
      status: 400,
      details: z.treeifyError(parsed.error),
    });
  }

  const queryString = buildQueryString(parsed.data);

  return withCijeneRoute("stores", listStoresResponseSchema, () =>
    cijeneApiV1Client.get(`/stores${queryString && `?${queryString}`}`),
  );
}
