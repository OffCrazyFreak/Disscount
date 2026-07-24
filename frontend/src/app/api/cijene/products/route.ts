import { NextRequest } from "next/server";
import { z } from "zod";
import {
  productSearchResponseSchema,
  searchProductsParamsSchema,
} from "@/lib/cijene-api/schemas";
import { searchProductsWithFuzzyFallback } from "@/lib/cijene-api/utils/product-search-fallback";
import { createApiError } from "@/lib/cijene-api/utils/response-utils";
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
    q: searchParams.get("q")?.trim(),
    date: searchParams.get("date") || undefined,
    chains: searchParams.get("chains") || undefined,
    fuzzy: parseBooleanParam(searchParams.get("fuzzy")),
    limit: limit ? parseInt(limit) : undefined,
  });

  if (!parsed.success) {
    return createApiError("Invalid parameters for products", {
      status: 400,
      details: z.treeifyError(parsed.error),
    });
  }

  return withCijeneRoute("products", productSearchResponseSchema, () =>
    searchProductsWithFuzzyFallback(parsed.data),
  );
}
