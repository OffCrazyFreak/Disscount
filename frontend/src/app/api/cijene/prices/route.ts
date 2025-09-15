import { NextRequest } from "next/server";
import { cijeneApiV1Client, CijeneApiError } from "@/lib/cijene-api/client";
import {
  getPricesParamsSchema,
  storePricesResponseSchema,
} from "@/lib/cijene-api/schemas";
import {
  createApiResponse,
  createApiError,
} from "@/lib/cijene-api/utils/response-utils";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Build raw params
  const raw = {
    eans: searchParams.get("eans")?.trim() || undefined,
    chains: searchParams.get("chains")?.trim() || undefined,
    city: searchParams.get("city")?.trim() || undefined,
    address: searchParams.get("address")?.trim() || undefined,
    lat: searchParams.get("lat")
      ? parseFloat(searchParams.get("lat")!)
      : undefined,
    lon: searchParams.get("lon")
      ? parseFloat(searchParams.get("lon")!)
      : undefined,
    d: searchParams.get("d") ? parseFloat(searchParams.get("d")!) : undefined,
  };

  // Validate and parse params
  const parsed = getPricesParamsSchema.safeParse(raw);
  if (!parsed.success) {
    return createApiError("Invalid parameters for prices", {
      status: 400,
      details: z.treeifyError(parsed.error),
    });
  }

  try {
    // Build query string
    const qs = new URLSearchParams();
    Object.entries(parsed.data).forEach(([k, v]) => {
      if (v !== undefined) {
        qs.set(k, String(v));
      }
    });

    const url = `/prices?${qs.toString()}`;
    const response = await cijeneApiV1Client.get(url);

    // Validate response
    const parsedResponse = storePricesResponseSchema.safeParse(response.data);
    if (!parsedResponse.success) {
      return createApiError("Invalid response from external API", {
        status: 500,
        details: z.treeifyError(parsedResponse.error),
      });
    }
    const data = parsedResponse.data;

    return createApiResponse(data);
  } catch (error) {
    if (error instanceof CijeneApiError) {
      return createApiError(error.message, {
        status: error.status >= 400 ? error.status : 500,
        // avoid leaking headers or internal metadata
        details: error.response,
      });
    }

    return createApiError("Failed to fetch prices from upstream", {
      status: 502,
    });
  }
}
