import { cijeneApiV0Client } from "@/lib/cijene-api/client";
import { listArchivesResponseSchema } from "@/lib/cijene-api/schemas";
import { withCijeneRoute } from "@/lib/cijene-api/utils/with-cijene-route";

export async function GET() {
  return withCijeneRoute("archives list", listArchivesResponseSchema, () =>
    cijeneApiV0Client.get("/list")
  );
}
