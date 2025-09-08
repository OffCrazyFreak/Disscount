import { NextRequest } from "next/server";
import { cijeneApiV1Client, CijeneApiError } from "@/lib/cijene-api/client";
import {
  productResponseSchema,
  getProductParamsSchema,
} from "@/lib/cijene-api/schemas";
import {
  createApiResponse,
  createApiError,
} from "@/lib/cijene-api/utils/response-utils";

type Params = {
  ean: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { ean } = await params;
  const { searchParams } = new URL(request.url);

  // Validate params
  const raw = {
    ean: ean.trim(),
    date: searchParams.get("date") || undefined,
    chains: searchParams.get("chains") || undefined,
  };
  const validated = getProductParamsSchema.safeParse(raw);
  if (!validated.success) {
    return createApiError("Invalid parameters", {
      status: 400,
      details: validated.error,
    });
  }

  try {
    const { ean: validEan, date, chains } = validated.data;
    const qs = new URLSearchParams();
    if (date) qs.append("date", date);
    if (chains) qs.append("chains", chains);

    const response = await cijeneApiV1Client.get(
      `/products/${encodeURIComponent(validEan)}${
        qs.toString() ? `?${qs}` : ""
      }`
    );

    const parsed = productResponseSchema.safeParse(response.data);
    if (!parsed.success) {
      return createApiError("Invalid response from external API", {
        status: 500,
      });
    }
    const data = parsed.data;
    return createApiResponse(data, {
      cacheControl: "public, max-age=21600, s-maxage=43200", // 6h browser, 12h CDN
    });
  } catch (error) {
    if (error instanceof CijeneApiError) {
      return createApiError(error.message, {
        status: error.status >= 400 ? error.status : 500,
        // avoid leaking headers or internal metadata
        details: error.response?.data,
      });
    }

    return createApiError("Failed to fetch product from upstream", {
      status: 502,
    });
  }
}
