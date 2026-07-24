import { z } from "zod";
import { cijeneApiV1Client } from "@/lib/cijene-api/client";
import {
  ProductResponse,
  SearchProductsParams,
  productSearchResponseSchema,
} from "@/lib/cijene-api/schemas";
import { buildQueryString } from "@/utils/generic";

/**
 * Fuzzy ranks by whole-string trigram distance, so it promotes short unrelated
 * rows and loses to exact search on every well-spelled query. It only wins where
 * exact returns almost nothing: https://github.com/senko/cijene-api/issues/65
 */
const FUZZY_FALLBACK_THRESHOLD = 10;

/** Upstream's own default when `limit` is omitted. */
const UPSTREAM_DEFAULT_LIMIT = 20;

const searchResultCountSchema = z.object({ products: z.array(z.unknown()) });

function fetchProducts(params: SearchProductsParams) {
  return cijeneApiV1Client.get(`/products?${buildQueryString(params)}`);
}

function countProducts(data: unknown): number | null {
  const parsed = searchResultCountSchema.safeParse(data);

  return parsed.success ? parsed.data.products.length : null;
}

function mergeByEan(
  exact: ProductResponse[],
  fuzzy: ProductResponse[],
  limit: number,
): ProductResponse[] {
  const alreadyMatched = new Set(exact.map((product) => product.ean));

  return [
    ...exact,
    ...fuzzy.filter((product) => !alreadyMatched.has(product.ean)),
  ].slice(0, limit);
}

/**
 * Searches exactly first and tops the result up with fuzzy matches when the
 * exact pass comes back nearly empty, so a typo still finds something without
 * costing ranking quality on the queries that already work.
 */
export async function searchProductsWithFuzzyFallback(
  params: SearchProductsParams,
): Promise<{ data: unknown }> {
  if (params.fuzzy) return fetchProducts(params);

  const exact = await fetchProducts({ ...params, fuzzy: false });
  const exactCount = countProducts(exact.data);

  if (exactCount === null || exactCount >= FUZZY_FALLBACK_THRESHOLD) {
    return exact;
  }

  const fuzzy = await fetchProducts({ ...params, fuzzy: true }).catch(
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
        params.limit ?? UPSTREAM_DEFAULT_LIMIT,
      ),
    },
  };
}
