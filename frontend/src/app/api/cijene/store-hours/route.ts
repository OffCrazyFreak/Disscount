import { proxyProblem } from "@/lib/backend-proxy/proxy-problem";
import { getStoreHours } from "@/lib/store-hours/get-store-hours";
import { createApiResponse } from "@/lib/cijene-api/utils/response-utils";

// Reads the database, so it must never be prerendered at build.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { hours, complete } = await getStoreHours();

    return createApiResponse(hours, {
      // An empty or half-imported set would stick for an hour in every browser.
      cacheControl: complete
        ? "public, max-age=3600, stale-while-revalidate=86400"
        : "private, no-store",
    });
  } catch (error) {
    console.error("[store-hours] failed", error);

    return proxyProblem("upstream_unavailable", request);
  }
}
