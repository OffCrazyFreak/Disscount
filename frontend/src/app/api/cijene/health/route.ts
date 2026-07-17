import { cijeneApiHealthClient } from "@/lib/cijene-api/client";
import { healthCheckResponseSchema } from "@/lib/cijene-api/schemas";
import { withCijeneRoute } from "@/lib/cijene-api/utils/with-cijene-route";

export async function GET() {
  return withCijeneRoute("health", healthCheckResponseSchema, () =>
    cijeneApiHealthClient.get("/health")
  );
}
