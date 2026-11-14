import { NextRequest } from "next/server";
import { proxyProblem } from "@/lib/backend-proxy/proxy-problem";
import {
  productSearchResponseSchema,
  searchProductsParamsSchema,
} from "@/lib/cijene-api/schemas";
import { searchProducts } from "@/lib/cijene-api/server/search-products";
import { withCijeneRoute } from "@/lib/cijene-api/utils/with-cijene-route";

function parseBooleanParam(value: string | null): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;

  return undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit");

  const parsed = searchProductsParamsSchema.safeParse({
    city: searchParams.get("city") || undefined,
    brand: searchParams.get("brand") || undefined,
    category: searchParams.get("category") || undefined,
    order: searchParams.get("order") || undefined,
    cursor: searchParams.get("cursor") || undefined,
    page_size: searchParams.has("page_size")
      ? Number(searchParams.get("page_size"))
      : undefined,
    q: searchParams.get("q")?.trim(),
    date: searchParams.get("date") || undefined,
    chains: searchParams.get("chains") || undefined,
    fuzzy: parseBooleanParam(searchParams.get("fuzzy")),
    limit: limit ? Number(limit) : undefined,
  });

  if (!parsed.success) {
    return proxyProblem("bad_request", request);
  }

  return withCijeneRoute(request, "products", productSearchResponseSchema, () =>
    searchProducts(parsed.data, request.signal),
  );
}
