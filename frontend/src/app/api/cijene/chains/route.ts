import { NextRequest } from "next/server";
import { cijeneApiV1Client, CijeneApiError } from "@/lib/cijene-api/client";
import { listChainsResponseSchema } from "@/lib/cijene-api/schemas";
import {
  createApiResponse,
  createApiError,
} from "@/lib/cijene-api/utils/response-utils";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const response = await cijeneApiV1Client.get("/chains/");

    // Validate response
    const parsed = listChainsResponseSchema.safeParse(response.data);
    if (!parsed.success) {
      return createApiError("Invalid response from external API", {
        status: 500,
        details: z.treeifyError(parsed.error),
      });
    }
    const validatedData = parsed.data;

    // Create response with caching headers (security headers via next.config.ts headers())
    return createApiResponse(validatedData, {
      cacheControl: "public, max-age=3600, s-maxage=7200", // 1h browser, 2h CDN (chains don't change often)
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
    return createApiError("Failed to fetch chains list from upstream", {
      status: 502,
    });
  }
}
