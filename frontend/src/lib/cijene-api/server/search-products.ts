import "server-only";
import type { AxiosInstance } from "axios";
import { locationNamesMap } from "@/constants/name-mappings";
import { CijeneApiError } from "@/lib/cijene-api/errors";
import { cijeneLatestClient } from "@/lib/cijene-api/client";
import type { SearchProductsParams } from "@/lib/cijene-api/schemas";
import { getServerProduct } from "@/lib/cijene-api/server/get-product";
import { searchProductsWithFuzzyFallback } from "@/lib/cijene-api/utils/product-search-fallback";
import { buildQueryString } from "@/utils/generic";
import { isWellFormedProductId } from "@/utils/product-id";

function canBeBarcodeLookup({ q, fuzzy, date }: SearchProductsParams) {
  return fuzzy === undefined && !date && isWellFormedProductId(q);
}

/** Upstream's search skips barcodes, so a typed one takes the scan lookup first. */
export async function searchProducts(
  params: SearchProductsParams,
  signal?: AbortSignal,
): Promise<{ data: unknown }> {
  if (cijeneLatestClient && !params.date) {
    return searchOwnedProducts(params, signal, cijeneLatestClient);
  }

  return searchPublicProducts(params, signal);
}

/** Public search caps at 100 rows, so scope is applied in the browser; a chain filter here would zero the other chains' facet counts. */
async function searchPublicProducts(
  { q, date, fuzzy, limit }: SearchProductsParams,
  signal?: AbortSignal,
): Promise<{ data: unknown }> {
  const params = { q, date, fuzzy, limit: Math.min(limit ?? 100, 100) };

  if (canBeBarcodeLookup(params)) {
    const result = await getServerProduct(q);

    if (result.status === "found") {
      return { data: { products: [result.product] } };
    }
  }

  return searchProductsWithFuzzyFallback(params, signal);
}

// Upstream city spellings that our labels merge, so the service can count each label once.
const CITY_LABELS = JSON.stringify(
  Object.fromEntries(
    Object.entries(locationNamesMap).filter(
      ([source, label]) => source !== label,
    ),
  ),
);

async function searchOwnedProducts(
  params: SearchProductsParams,
  signal: AbortSignal | undefined,
  client: AxiosInstance,
): Promise<{ data: unknown }> {
  if (isWellFormedProductId(params.q))
    return lookupOwnedIdentity(params, signal, client);

  const response = await client.get(
    `/products/?${buildQueryString({ ...params, city_labels: CITY_LABELS })}`,
    { signal },
  );

  return { data: { ...response.data, source: "owned" } };
}

async function lookupOwnedIdentity(
  { q, ...scope }: SearchProductsParams,
  signal: AbortSignal | undefined,
  client: AxiosInstance,
): Promise<{ data: unknown }> {
  const product: unknown = await client
    .get(
      `/products/${encodeURIComponent(q)}/?${buildQueryString({ ...scope, city_labels: CITY_LABELS })}`,
      { signal },
    )
    .then(
      (response) => response.data,
      (error: unknown) => {
        if (error instanceof CijeneApiError && error.status === 404) {
          return null;
        }

        throw error;
      },
    );

  return {
    data: {
      products: product ? [product] : [],
      source: "owned",
      total: product ? 1 : 0,
      complete: true,
      partial: reportsPartialPrices(product),
    },
  };
}

function reportsPartialPrices(product: unknown): boolean {
  return (
    typeof product === "object" &&
    product !== null &&
    "partial" in product &&
    product.partial === true
  );
}
