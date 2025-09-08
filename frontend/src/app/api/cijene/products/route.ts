import { NextRequest } from "next/server";
import { cijeneApiV1Client, CijeneApiError } from "@/lib/cijene-api/client";
import {
  searchProductsParamsSchema,
  productSearchResponseSchema,
} from "@/lib/cijene-api/schemas";
import {
  createApiResponse,
  createApiError,
} from "@/lib/cijene-api/utils/response-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Validate query params (convert null to undefined for optional fields)
  const params = {
    q: searchParams.get("q"),
    date: searchParams.get("date") || undefined,
    chains: searchParams.get("chains") || undefined,
  };
  const validatedParams = searchProductsParamsSchema.parse(params);
  if (!validatedParams) {
    return createApiError("Invalid params", { status: 400 });
  }

  // Build search string from validated params
  const searchParamsObj = new URLSearchParams();
  searchParamsObj.append("q", validatedParams.q);
  if (validatedParams.date)
    searchParamsObj.append("date", validatedParams.date);
  if (validatedParams.chains)
    searchParamsObj.append("chains", validatedParams.chains);
  const searchString = searchParamsObj.toString();

  try {
    const response = await cijeneApiV1Client.get(`/products?${searchString}`);

    // Validate response
    const validatedData = productSearchResponseSchema.parse(response.data);

    // Return with caching (security via middleware)
    return createApiResponse(validatedData, {
      cacheControl: "public, max-age=10800, s-maxage=21600",
    }); // 3h browser, 6h CDN
  } catch (error) {
    if (error instanceof CijeneApiError) {
      return createApiError(error.message, {
        status: error.status >= 400 ? error.status : 500,
        details: error.response,
      });
    }

    console.error("Unexpected error in products search:", error);
    return createApiError("Failed to fetch products", { status: 500 });
  }
}
