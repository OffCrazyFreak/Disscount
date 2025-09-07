import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import {
  searchProductsParamsSchema,
  productSearchResponseSchema,
} from "@/lib/cijene-api/schemas";

const CIJENE_API_URL = process.env.CIJENE_API_URL || "https://api.cijene.dev";
const CIJENE_API_TOKEN = process.env.CIJENE_API_TOKEN;

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
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
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
    const response = await axios.get(
      `${CIJENE_API_URL}/v1/products?${searchString}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(CIJENE_API_TOKEN && {
            Authorization: `Bearer ${CIJENE_API_TOKEN}`,
          }),
        },
      }
    );

    // Validate response
    const validatedData = productSearchResponseSchema.parse(response.data);

    // Create response with security and caching headers
    const nextResponse = NextResponse.json(validatedData);
    nextResponse.headers.set("X-Content-Type-Options", "nosniff");
    nextResponse.headers.set("X-Frame-Options", "DENY");
    nextResponse.headers.set("X-XSS-Protection", "1; mode=block");
    nextResponse.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
    nextResponse.headers.set(
      "Cache-Control",
      "public, max-age=10800, s-maxage=21600"
    ); // 3h browser, 6h CDN

    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
