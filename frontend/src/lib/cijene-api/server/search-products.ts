import "server-only";
import type { SearchProductsParams } from "@/lib/cijene-api/schemas";
import { getServerProductData } from "@/lib/cijene-api/server/get-product";
import { searchProductsWithFuzzyFallback } from "@/lib/cijene-api/utils/product-search-fallback";
import { isWellFormedProductId } from "@/utils/product-id";

function canBeBarcodeLookup({ q, fuzzy, date, chains }: SearchProductsParams) {
  return fuzzy === undefined && !date && !chains && isWellFormedProductId(q);
}

/** Upstream's search skips barcodes, so a typed one takes the scan lookup first; the route validates its raw answer. */
export async function searchProducts(
  params: SearchProductsParams,
): Promise<{ data: unknown }> {
  if (canBeBarcodeLookup(params)) {
    const result = await getServerProductData(params.q);

    if (result.status === "found") {
      return { data: { products: [result.product] } };
    }
  }

  return searchProductsWithFuzzyFallback(params);
}
