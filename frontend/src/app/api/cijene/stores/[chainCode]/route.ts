import { NextRequest } from "next/server";
import { cijeneApiV1Client, CijeneApiError } from "@/lib/cijene-api/client";
import { listStoresResponseSchema } from "@/lib/cijene-api/schemas";
import {
  createApiResponse,
  createApiError,
} from "@/lib/cijene-api/utils/response-utils";

type Params = {
  chainCode: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { chainCode } = params;

  // Validate chain code parameter
  if (!chainCode || typeof chainCode !== "string") {
    return createApiError("Chain code is required", { status: 400 });
  }

  try {
    const response = await cijeneApiV1Client.get(`/${chainCode}/stores/`);

    // Validate response
    const validatedData = listStoresResponseSchema.parse(response.data);

    // Create response with caching headers (security headers handled by middleware)
    return createApiResponse(validatedData, {
      cacheControl: "public, max-age=1800, s-maxage=3600", // 30min browser, 1h CDN (stores change occasionally)
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
    console.error(`Stores for chain ${chainCode} fetch failed:`, error);
    return createApiError("Failed to fetch stores for chain", { status: 500 });
  }
}
