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
import { z } from "zod";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Validate query params (convert null to undefined for optional fields)
  const params = {
    q: searchParams.get("q")?.trim(),
    date: searchParams.get("date") || undefined,
    chains: searchParams.get("chains") || undefined,
  };
  const parsed = searchProductsParamsSchema.safeParse(params);
  if (!parsed.success) {
    return createApiError("Invalid params", {
      status: 400,
      details: z.treeifyError(parsed.error),
    });
  }
  const validatedParams = parsed.data;

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
    const parsedResponse = productSearchResponseSchema.safeParse(response.data);
    if (!parsedResponse.success) {
      return createApiError("Invalid response from external API", {
        status: 500,
        details: z.treeifyError(parsedResponse.error),
      });
    }
    const validatedData = parsedResponse.data;

    // Return with caching (security via middleware)
    return createApiResponse(validatedData, {
      cacheControl: "no-cache",
    });
  } catch (error) {
    if (error instanceof CijeneApiError) {
      return createApiError(error.message, {
        status: error.status >= 400 ? error.status : 500,
        // avoid leaking headers or internal metadata
        details: error.response?.data,
      });
    }

    return createApiError("Failed to fetch products from upstream", {
      status: 502,
    });
  }
}
