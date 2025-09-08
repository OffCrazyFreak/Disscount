import { NextRequest } from "next/server";
import { cijeneApiHealthClient, CijeneApiError } from "@/lib/cijene-api/client";
import { healthCheckResponseSchema } from "@/lib/cijene-api/schemas";
import {
  createApiResponse,
  createApiError,
} from "@/lib/cijene-api/utils/response-utils";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const response = await cijeneApiHealthClient.get("/health");

    // Validate response
    const parsed = healthCheckResponseSchema.safeParse(response.data);
    if (!parsed.success) {
      return createApiError("Invalid response from external API", {
        status: 500,
        details: z.treeifyError(parsed.error),
      });
    }
    const validatedData = parsed.data;

    // Create response with caching headers (security headers via next.config.ts headers())
    return createApiResponse(validatedData, {
      cacheControl: "public, max-age=30, s-maxage=60", // 30s browser, 1min CDN
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
    return createApiError("Failed to check health from upstream", {
      status: 502,
    });
  }
}
