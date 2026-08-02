"use client";

import { useMemo } from "react";
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

type CombinedProductQueries = Omit<IProductsByEans, "productsByEan">;

// Declared at module scope so TanStack can memoise the combined result rather
// than rebuilding it on every render. The by-EAN map is not built here: it needs
// the requested EANs, which `combine` is not handed.
function combineProductQueries(
  results: ProductQueryResult[],
): CombinedProductQueries {
  const products = results
    .map((result) => result.data)
    .filter((data): data is ProductResponse => data !== undefined);

  return {
    results,
    products,
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
  const combined = useQueries({
    queries: eans.map((ean) => ({
      queryKey: CIJENE_QUERY_KEYS.productByEan({ ean }),
      queryFn: () => getProductByEan({ ean }),
      enabled: enabled && Boolean(ean),
      staleTime: CACHE_TIMES.products,
    })),
    combine: combineProductQueries,
  });

  // Keyed by the requested EAN, not the one echoed back. useQueries keeps
  // results index-aligned with `eans`, and upstream is free to normalise the
  // value it returns, which would silently miss every lookup by the caller.
  const productsByEan = useMemo(() => {
    const map = new Map<string, ProductResponse>();

    combined.results.forEach((result, index) => {
      const ean = eans[index];
      if (ean && result.data) map.set(ean, result.data);
    });

    return map;
  }, [combined.results, eans]);

  return { ...combined, productsByEan };
}
