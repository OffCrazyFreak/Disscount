import { NextRequest } from "next/server";
import { cijeneApiV1Client, CijeneApiError } from "@/lib/cijene-api/client";
import { chainStatsResponseSchema } from "@/lib/cijene-api/schemas";
import {
  createApiResponse,
  createApiError,
} from "@/lib/cijene-api/utils/response-utils";

export async function GET(_request: NextRequest) {
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

    // Create response (security headers via next.config.ts headers())
    return createApiResponse(validatedData);
  } catch (error) {
    // Handle CijeneApiError with proper status codes
    if (error instanceof CijeneApiError) {
      return createApiError(error.message, {
        status: error.status >= 400 ? error.status : 500,
        // avoid leaking headers or internal metadata
        details: error.response?.data,
      });
    }

    // Handle other errors
    return createApiError("Failed to fetch chain stats from upstream", {
      status: 502,
    });
  }
}
