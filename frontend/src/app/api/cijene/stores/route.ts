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
    try {
      searchStoresParamsSchema.parse(params);
    } catch (validationError) {
      return createApiError("Invalid search parameters", {
        status: 400,
        details: validationError,
      });
    }

    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const response = await cijeneApiV1Client.get(
      `/stores${queryString && `?${queryString}`}`
    );

    // Validate response
    const validatedData = listStoresResponseSchema.parse(response.data);

    // Create response with caching headers (security headers handled by middleware)
    return createApiResponse(validatedData, {
      cacheControl: "public, max-age=1800, s-maxage=3600", // 30min browser, 1h CDN
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
    console.error("Stores fetch failed:", error);
    return createApiError("Failed to fetch stores", { status: 500 });
  }
}
