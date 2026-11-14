import "server-only";
import { CijeneApiError } from "@/lib/cijene-api/errors";
import { cijeneLatestClient } from "@/lib/cijene-api/client";
import { isWellFormedProductId as isIdentity } from "@/utils/product-id";
import type { SearchProductsParams } from "@/lib/cijene-api/schemas";
import { getServerProduct } from "@/lib/cijene-api/server/get-product";
import { searchProductsWithFuzzyFallback } from "@/lib/cijene-api/utils/product-search-fallback";
import { isWellFormedProductId } from "@/utils/product-id";

function canBeBarcodeLookup({ q, fuzzy, date, chains }: SearchProductsParams) {
  return fuzzy === undefined && !date && !chains && isWellFormedProductId(q);
}

/** Upstream's search skips barcodes, so a typed one takes the scan lookup first. */
export async function searchProducts(
  params: SearchProductsParams,
  signal?: AbortSignal,
): Promise<{ data: unknown }> {
  if (cijeneLatestClient && !params.date) {
    return searchOwnedProducts(params, signal, cijeneLatestClient);
  }

  const publicParams = {
    ...params,
    chains: params.order ? undefined : params.chains,
  };

  if (canBeBarcodeLookup(publicParams)) {
    const result = await getServerProduct(params.q);

    if (result.status === "found") {
      return { data: { products: [result.product] } };
    }
  }

  return searchProductsWithFuzzyFallback(
    {
      q: params.q,
      date: params.date,
      chains: publicParams.chains,
      fuzzy: params.fuzzy,
      limit: Math.min(params.limit ?? 100, 100),
    },
    signal,
  );
}

async function searchOwnedProducts(
  params: SearchProductsParams,
  signal: AbortSignal | undefined,
  client: import("axios").AxiosInstance,
): Promise<{ data: unknown }> {
  const { q, ...scope } = params;
  const response = await client
    .get(isIdentity(q) ? `/products/${encodeURIComponent(q)}/` : "/products/", {
      params: isIdentity(q) ? scope : params,
      signal,
    })
    .catch((error: unknown) => {
      if (
        isIdentity(q) &&
        error instanceof CijeneApiError &&
        error.status === 404
      )
        return { data: null };
      throw error;
    });
  return {
    data: isIdentity(q)
      ? {
          products: response.data ? [response.data] : [],
          source: "owned",
          total: response.data ? 1 : 0,
          complete: true,
          partial: true,
        }
      : { ...response.data, source: "owned" },
  };
}
