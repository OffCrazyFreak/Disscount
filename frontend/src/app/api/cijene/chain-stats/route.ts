import { cijeneApiV1Client } from "@/lib/cijene-api/client";
import { chainStatsResponseSchema } from "@/lib/cijene-api/schemas";
import { withCijeneRoute } from "@/lib/cijene-api/utils/with-cijene-route";

export async function GET() {
  return withCijeneRoute("chain stats", chainStatsResponseSchema, () =>
    cijeneApiV1Client.get("/chain-stats/"),
  );
}
