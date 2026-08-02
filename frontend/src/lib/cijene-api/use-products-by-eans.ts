"use client";

import { useQueries, type UseQueryResult } from "@tanstack/react-query";

import { getProductByEan } from "@/lib/cijene-api/queries";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { CACHE_TIMES } from "@/lib/query/cache-times";

type ProductQueryResult = UseQueryResult<ProductResponse, Error>;

export interface IProductsByEans {
  /** Per-EAN, in the order given, for callers that render a row while its own product loads. */
  results: ProductQueryResult[];
  products: ProductResponse[];
  productsByEan: Map<string, ProductResponse>;
  pending: boolean;
  isError: boolean;
  /** Newest successful fetch across the set, for a "last synced" label. 0 when none. */
  updatedAt: number;
}

// Declared at module scope so TanStack can memoise the combined result rather
// than rebuilding it on every render.
function combineProductQueries(results: ProductQueryResult[]): IProductsByEans {
  const products = results
    .map((result) => result.data)
    .filter((data): data is ProductResponse => data !== undefined);

  return {
    results,
    products,
    productsByEan: new Map(products.map((product) => [product.ean, product])),
    pending: results.some((result) => result.isPending),
    isError: results.some((result) => result.isError),
    updatedAt: results.reduce(
      (newest, result) => Math.max(newest, result.dataUpdatedAt),
      0,
    ),
  };
}

/**
 * Prices for a set of products, fetched one request per EAN so each row can
 * resolve on its own instead of the slowest one holding up the page.
 *
 * Shared by the shopping list detail, its store analysis, the watchlist and the
 * notification bell, which each used to carry their own copy of this block. The
 * key is the one product cards seed and the product modal reads, so a row that
 * is already on screen opens instantly.
 */
export function useProductsByEans(
  eans: string[],
  { enabled = true }: { enabled?: boolean } = {},
): IProductsByEans {
  return useQueries({
    queries: eans.map((ean) => ({
      queryKey: CIJENE_QUERY_KEYS.productByEan({ ean }),
      queryFn: () => getProductByEan({ ean }),
      enabled: enabled && Boolean(ean),
      staleTime: CACHE_TIMES.products,
    })),
    combine: combineProductQueries,
  });
}
