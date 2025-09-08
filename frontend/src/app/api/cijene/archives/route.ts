import { NextRequest } from "next/server";
import { cijeneApiV0Client, CijeneApiError } from "@/lib/cijene-api/client";
import { listArchivesResponseSchema } from "@/lib/cijene-api/schemas";
import {
  createApiResponse,
  createApiError,
} from "@/lib/cijene-api/utils/response-utils";

export async function GET(request: NextRequest) {
  try {
    const response = await cijeneApiV0Client.get("/list");

    // Validate response
    const validatedData = listArchivesResponseSchema.parse(response.data);

    // Create response with caching headers (security headers handled by middleware)
    return createApiResponse(validatedData, {
      cacheControl: "public, max-age=3600, s-maxage=7200", // 1h browser, 2h CDN (archives don't change often)
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
    console.error("Archives list failed:", error);
    return createApiError("Failed to fetch archives list", { status: 500 });
  }
}
