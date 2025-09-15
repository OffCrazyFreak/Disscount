import { NextRequest } from "next/server";
import { cijeneApiV0Client, CijeneApiError } from "@/lib/cijene-api/client";
import { listArchivesResponseSchema } from "@/lib/cijene-api/schemas";
import {
  createApiResponse,
  createApiError,
} from "@/lib/cijene-api/utils/response-utils";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const response = await cijeneApiV0Client.get("/list");

    // Validate response
    const parsed = listArchivesResponseSchema.safeParse(response.data);
    if (!parsed.success) {
      return createApiError("Invalid response from external API", {
        status: 500,
        details: z.treeifyError(parsed.error),
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
        details: error.response,
      });
    }

    // Handle other errors
    return createApiError("Failed to fetch archives list from upstream", {
      status: 502,
    });
  }
}
