import { proxyProblem } from "@/lib/backend-proxy/proxy-problem";
import { getStoreDirectory } from "@/lib/store-locations/get-store-directory";
import { createApiResponse } from "@/lib/cijene-api/utils/response-utils";

// Reads the database and upstream, so it must never be prerendered at build.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    return createApiResponse(await getStoreDirectory(), {
      cacheControl: "public, max-age=3600, stale-while-revalidate=86400",
    });
  } catch (error) {
    console.error("[store-directory] failed", error);

    return proxyProblem("upstream_unavailable", request);
  }
}
