"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";

import {
  PRODUCT_QUERY_MIN_LENGTH,
  PRODUCT_SEARCH_LIMIT,
} from "@/constants/products";
import { parseProblem } from "@/lib/api/problem-details";
import { CURSOR_EXPIRED } from "@/lib/backend-proxy/proxy-contract";
import { getProductByName } from "@/lib/cijene-api/queries";
import type {
  ProductSearchResponse,
  SearchProductsParams,
} from "@/lib/cijene-api/schemas";
import { visibleSearchLength } from "@/utils/strings";

interface IProductPageScope {
  selectedChains?: string[];
  selectedSourceCities?: string[];
  selectedLocations?: string[];
  selectedCategories?: string[];
  selectedBrands?: string[];
}

function nonEmpty(values: string[] | undefined) {
  return values?.length ? values : undefined;
}

export function productPageParams(
  q: string,
  scope: IProductPageScope,
): SearchProductsParams {
  return {
    q,
    limit: PRODUCT_SEARCH_LIMIT,
    // Chain codes never contain commas, so chains alone stays one joined value.
    chains: scope.selectedChains?.join(",") || undefined,
    city:
      nonEmpty(scope.selectedSourceCities) ?? nonEmpty(scope.selectedLocations),
    category: nonEmpty(scope.selectedCategories),
    brand: nonEmpty(scope.selectedBrands),
    order: "relevance",
  };
}

type IProductPages = InfiniteData<ProductSearchResponse, string | undefined>;

// Module level, so TanStack reruns it only when the pages change.
function mergePages(data: IProductPages): ProductSearchResponse {
  const seen = new Set<string>();

  const products = data.pages
    .flatMap((page) => page.products)
    .filter((product) => {
      if (seen.has(product.ean)) return false;

      seen.add(product.ean);
      return true;
    });

  return { ...data.pages[0], products };
}

function isCursorExpired(error: unknown): boolean {
  return (
    isAxiosError(error) &&
    error.response?.status === 409 &&
    parseProblem(error)?.code === CURSOR_EXPIRED
  );
}

const PRODUCT_PAGES_ROOT = ["cijene", "product-pages"] as const;

interface ICachedPages {
  data: IProductPages;
  updatedAt: number;
}

const PRODUCT_PAGES_STALE_TIME_MS = 60 * 1000;

/** The public request carries only these, so an entry matching them answered the same upstream call. */
function isSamePublicRequest(
  cached: SearchProductsParams,
  params: SearchProductsParams,
) {
  return (
    cached.q === params.q &&
    cached.limit === params.limit &&
    cached.date === params.date &&
    cached.fuzzy === params.fuzzy
  );
}

/** Public search ignores scope, so a fresh answer for the same words already holds every scope's rows. */
function cachedPublicPages(
  queryClient: QueryClient,
  params: SearchProductsParams,
): ICachedPages | undefined {
  const freshSince = Date.now() - PRODUCT_PAGES_STALE_TIME_MS;
  let freshest: ICachedPages | undefined;

  for (const query of queryClient
    .getQueryCache()
    .findAll({ queryKey: PRODUCT_PAGES_ROOT })) {
    const data = query.state.data as IProductPages | undefined;
    const firstPage = data?.pages[0];
    const updatedAt = query.state.dataUpdatedAt;

    if (!data || !firstPage || firstPage.source === "owned") continue;
    if (updatedAt <= freshSince) continue;
    if (!isSamePublicRequest(query.queryKey[2] as SearchProductsParams, params))
      continue;

    if (!freshest || updatedAt > freshest.updatedAt) {
      freshest = { data, updatedAt };
    }
  }

  return freshest;
}

export default function useProductPages(params: SearchProductsParams) {
  const queryClient = useQueryClient();
  const enabled =
    visibleSearchLength(params.q) >= PRODUCT_QUERY_MIN_LENGTH.submitted;
  const queryKey = [...PRODUCT_PAGES_ROOT, params];

  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      getProductByName({ ...params, cursor: pageParam }, signal),
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    enabled,
    initialData: () =>
      enabled ? cachedPublicPages(queryClient, params)?.data : undefined,
    initialDataUpdatedAt: () =>
      cachedPublicPages(queryClient, params)?.updatedAt,
    // A scope change keeps the old grid and facet counts on screen until the new scope answers.
    placeholderData: enabled ? keepPreviousData : undefined,
    select: mergePages,
    staleTime: PRODUCT_PAGES_STALE_TIME_MS,
  });

  // New price data invalidates every loaded cursor, so the pages restart instead of mixing two imports.
  async function fetchNextPage() {
    const result = await query.fetchNextPage();

    if (result.isFetchNextPageError && isCursorExpired(result.error)) {
      await queryClient.resetQueries({ queryKey, exact: true });
    }

    return result;
  }

  return {
    ...query,
    data: enabled ? query.data : undefined,
    fetchNextPage,
  };
}
