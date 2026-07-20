import { cijeneApiV1Client } from "@/lib/cijene-api/client";
import { listChainsResponseSchema } from "@/lib/cijene-api/schemas";
import { withCijeneRoute } from "@/lib/cijene-api/utils/with-cijene-route";

export async function GET() {
  return withCijeneRoute("chains list", listChainsResponseSchema, () =>
    cijeneApiV1Client.get("/chains/"),
  );
}
