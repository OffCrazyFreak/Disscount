import { z } from "zod";
import { cijeneApiV1Client } from "@/lib/cijene-api/client";
import {
  ProductResponse,
  SearchProductsParams,
  productSearchResponseSchema,
} from "@/lib/cijene-api/schemas";
import { UPSTREAM_DEFAULT_SEARCH_LIMIT } from "@/constants/products";
import { buildQueryString } from "@/utils/generic";

/** Fuzzy promotes short unrelated rows, so exact comes first: https://github.com/senko/cijene-api/issues/65 */
const FUZZY_FALLBACK_THRESHOLD = 10;

/** Upstream matches on trigrams, which shorter queries cannot produce. */
const MIN_FUZZY_QUERY_LENGTH = 3;

const searchResultCountSchema = z.object({ products: z.array(z.unknown()) });

function fetchProducts(params: SearchProductsParams, signal?: AbortSignal) {
  return cijeneApiV1Client.get(`/products?${buildQueryString(params)}`, {
    signal,
  });
}

function countProducts(data: unknown): number | null {
  const parsed = searchResultCountSchema.safeParse(data);

  return parsed.success ? parsed.data.products.length : null;
}

function hasExplicitSearchMode(params: SearchProductsParams): boolean {
  return params.fuzzy !== undefined;
}

function canFuzzyMatch(query: string): boolean {
  return query.trim().length >= MIN_FUZZY_QUERY_LENGTH;
}

function mergeByEan(
  exact: ProductResponse[],
  fuzzy: ProductResponse[],
  limit: number,
): ProductResponse[] {
  const seen = new Set(exact.map((product) => product.ean));
  const merged = [...exact];

  for (const product of fuzzy) {
    if (seen.has(product.ean)) continue;

    seen.add(product.ean);
    merged.push(product);
  }

  return merged.slice(0, limit);
}

/** Fuzzy only tops up a nearly empty pass, so typos find something without hurting ranking. */
export async function searchProductsWithFuzzyFallback(
  params: SearchProductsParams,
  signal?: AbortSignal,
): Promise<{ data: unknown }> {
  if (hasExplicitSearchMode(params)) return fetchProducts(params, signal);

  const exact = await fetchProducts({ ...params, fuzzy: false }, signal);
  const exactCount = countProducts(exact.data);
  const effectiveLimit = params.limit ?? UPSTREAM_DEFAULT_SEARCH_LIMIT;
  const fallbackThreshold = Math.min(FUZZY_FALLBACK_THRESHOLD, effectiveLimit);

  if (exactCount === null || exactCount >= fallbackThreshold) return exact;
  if (!canFuzzyMatch(params.q)) return exact;

  const fuzzy = await fetchProducts({ ...params, fuzzy: true }, signal).catch(
    () => null,
  );

  const exactParsed = productSearchResponseSchema.safeParse(exact.data);
  const fuzzyParsed = productSearchResponseSchema.safeParse(fuzzy?.data);

  if (!exactParsed.success || !fuzzyParsed.success) return exact;

  return {
    data: {
      products: mergeByEan(
        exactParsed.data.products,
        fuzzyParsed.data.products,
        effectiveLimit,
      ),
    },
  };
}
