import { NextRequest } from "next/server";
import { cijeneApiV1Client, CijeneApiError } from "@/lib/cijene-api/client";
import { chainStatsResponseSchema } from "@/lib/cijene-api/schemas";
import {
  createApiResponse,
  createApiError,
} from "@/lib/cijene-api/utils/response-utils";

export async function GET(request: NextRequest) {
  try {
    const response = await cijeneApiV1Client.get("/chain-stats/");

    // Validate response
    const parsed = chainStatsResponseSchema.safeParse(response.data);
    if (!parsed.success) {
      return createApiError("Invalid response from external API", {
        status: 500,
      });
    }
    const validatedData = parsed.data;

    // Create response with caching headers (security headers handled by middleware)
    return createApiResponse(validatedData, {
      cacheControl: "public, max-age=21600, s-maxage=43200", // 6h browser, 12h CDN (stats change infrequently)
    });
  } catch (error) {
    // Handle CijeneApiError with proper status codes
    if (error instanceof CijeneApiError) {
      return createApiError(error.message, {
        status: error.status >= 400 ? error.status : 500,
        details: error.response,
      });
    }

    // Handle other errors
    console.error("Chain stats failed:", error);
    return createApiError("Failed to fetch chain stats", { status: 500 });
  }
}
