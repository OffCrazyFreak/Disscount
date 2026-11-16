"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import axios from "axios";

import {
  PRODUCT_QUERY_MIN_LENGTH,
  PRODUCT_SEARCH_LIMIT,
} from "@/constants/products";
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

type IProductPage = ProductSearchResponse & { restarted?: true };

export function productPageParams(
  q: string,
  scope: IProductPageScope,
): SearchProductsParams {
  return {
    q,
    limit: PRODUCT_SEARCH_LIMIT,
    chains: scope.selectedChains?.join(",") || undefined,
    city:
      scope.selectedSourceCities?.join(",") ||
      scope.selectedLocations?.join(",") ||
      undefined,
    category: scope.selectedCategories?.join(",") || undefined,
    brand: scope.selectedBrands?.join(",") || undefined,
    order: "relevance",
  };
}

// Module level, so TanStack reruns it only when the pages change.
function mergePages(
  data: InfiniteData<IProductPage, string | undefined>,
): ProductSearchResponse {
  const restart = data.pages.findLastIndex((page) => page.restarted);
  const currentPages = data.pages.slice(Math.max(0, restart));
  const seen = new Set<string>();

  const products = currentPages
    .flatMap((page) => page.products)
    .filter((product) => {
      if (seen.has(product.ean)) return false;

      seen.add(product.ean);
      return true;
    });

  return { ...currentPages[0], products };
}

export default function useProductPages(params: SearchProductsParams) {
  const enabled =
    visibleSearchLength(params.q) >= PRODUCT_QUERY_MIN_LENGTH.submitted;

  const query = useInfiniteQuery({
    queryKey: ["cijene", "product-pages", params],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam, signal }): Promise<IProductPage> => {
      try {
        return await getProductByName({ ...params, cursor: pageParam }, signal);
      } catch (error) {
        if (
          pageParam &&
          axios.isAxiosError(error) &&
          error.response?.status === 400
        ) {
          const page = await getProductByName(params, signal);
          return { ...page, restarted: true };
        }
        throw error;
      }
    },
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    enabled,
    // A scope change keeps the old grid and facet counts on screen until the new scope answers.
    placeholderData: enabled ? keepPreviousData : undefined,
    select: mergePages,
    staleTime: 60 * 1000,
  });

  return { ...query, data: enabled ? query.data : undefined };
}
