import { NextRequest } from "next/server";
import { cijeneApiV1Client, CijeneApiError } from "@/lib/cijene-api/client";
import {
  listStoresResponseSchema,
  searchStoresParamsSchema,
} from "@/lib/cijene-api/schemas";
import {
  createApiResponse,
  createApiError,
} from "@/lib/cijene-api/utils/response-utils";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  try {
    // General store search: /v1/stores/ with optional filters
    const params = {
      chains: searchParams.get("chains") || undefined,
      city: searchParams.get("city") || undefined,
      address: searchParams.get("address") || undefined,
      lat: searchParams.get("lat")
        ? parseFloat(searchParams.get("lat")!)
        : undefined,
      lon: searchParams.get("lon")
        ? parseFloat(searchParams.get("lon")!)
        : undefined,
      d: searchParams.get("d") ? parseFloat(searchParams.get("d")!) : undefined,
    };

    // Validate search parameters
    const parsed = searchStoresParamsSchema.safeParse(params);
    if (!parsed.success) {
      return createApiError("Invalid search parameters", {
        status: 400,
        details: z.treeifyError(parsed.error),
      });
    }

    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(parsed.data).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const response = await cijeneApiV1Client.get(
      `/stores${queryString && `?${queryString}`}`
    );

    // Validate response
    const parsedResponse = listStoresResponseSchema.safeParse(response.data);
    if (!parsedResponse.success) {
      return createApiError("Invalid response from external API", {
        status: 500,
        details: z.treeifyError(parsedResponse.error),
      });
    }
    const validatedData = parsedResponse.data;

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
    return createApiError("Failed to fetch stores from upstream", {
      status: 502,
    });
  }
}
