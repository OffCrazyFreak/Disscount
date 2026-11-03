import { proxyProblem } from "@/lib/backend-proxy/proxy-problem";
import { getStoreHours } from "@/lib/store-hours/get-store-hours";
import { createApiResponse } from "@/lib/cijene-api/utils/response-utils";

// Reads the database, so it must never be prerendered at build.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    return createApiResponse(await getStoreHours(), {
      cacheControl: "public, max-age=3600, stale-while-revalidate=86400",
    });
  } catch (error) {
    console.error("[store-hours] failed", error);

    return proxyProblem("upstream_unavailable", request);
  }
}
