import { z } from "zod";
import { cijeneApiV1Client } from "@/lib/cijene-api/client";
import { listStoresResponseSchema } from "@/lib/cijene-api/schemas";
import { createApiError } from "@/lib/cijene-api/utils/response-utils";
import { withCijeneRoute } from "@/lib/cijene-api/utils/with-cijene-route";

const chainCodeParamSchema = z.object({
  chainCode: z.string().trim().min(1, "Chain code is required"),
});

export async function GET(
  _request: Request,
  context: RouteContext<"/api/cijene/stores/[chainCode]">
) {
  const parsed = chainCodeParamSchema.safeParse(await context.params);

  if (!parsed.success) {
    return createApiError("Invalid parameters for chain stores", {
      status: 400,
      details: z.treeifyError(parsed.error),
    });
  }

  const { chainCode } = parsed.data;

  return withCijeneRoute("stores for chain", listStoresResponseSchema, () =>
    cijeneApiV1Client.get(`/${encodeURIComponent(chainCode)}/stores/`)
  );
}
