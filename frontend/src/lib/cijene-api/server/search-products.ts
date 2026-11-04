import "server-only";
import type { SearchProductsParams } from "@/lib/cijene-api/schemas";
import { getServerProduct } from "@/lib/cijene-api/server/get-product";
import { searchProductsWithFuzzyFallback } from "@/lib/cijene-api/utils/product-search-fallback";
import { isWellFormedProductId } from "@/utils/product-id";

function canBeBarcodeLookup({ q, fuzzy, date, chains }: SearchProductsParams) {
  return fuzzy === undefined && !date && !chains && isWellFormedProductId(q);
}

/** Upstream's search matches names and brands only, so a typed barcode takes the scan lookup; a number no product carries is searched as text. */
export async function searchProducts(
  params: SearchProductsParams,
): Promise<{ data: unknown }> {
  if (canBeBarcodeLookup(params)) {
    const result = await getServerProduct(params.q);

    if (result.status === "found") {
      return { data: { products: [result.product] } };
    }
  }

  return searchProductsWithFuzzyFallback(params);
}
