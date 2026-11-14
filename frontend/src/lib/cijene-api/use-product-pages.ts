"use client";

import { normalizeForSearch } from "@/utils/strings";

import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { PRODUCT_SEARCH_LIMIT } from "@/constants/products";
import { getProductByName } from "@/lib/cijene-api/queries";
import type { SearchProductsParams } from "@/lib/cijene-api/schemas";

interface IProductPageScope {
  selectedChains?: string[];
  selectedSourceCities?: string[];
  selectedCategories?: string[];
  selectedBrands?: string[];
}

export function productPageParams(
  q: string,
  scope: IProductPageScope,
): SearchProductsParams {
  return {
    q,
    limit: PRODUCT_SEARCH_LIMIT,
    chains: scope.selectedChains?.join(",") || undefined,
    city: scope.selectedSourceCities?.join(",") || undefined,
    category: scope.selectedCategories?.join(",") || undefined,
    brand: scope.selectedBrands?.join(",") || undefined,
    order: "relevance",
  };
}

export default function useProductPages(params: SearchProductsParams) {
  const query = useInfiniteQuery({
    queryKey: ["cijene", "product-pages", params],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam, signal }) => {
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
    enabled:
      params.q.length === 0 ||
      normalizeForSearch(params.q).replace(/\s/gu, "").length >= 2,
    placeholderData: (previous) =>
      previous?.pages[0]?.source === "owned" ? undefined : previous,
    staleTime: 60 * 1000,
  });

  const pages = query.data?.pages ?? [];
  const restart = pages.findLastIndex((page) => "restarted" in page);
  const currentPages = pages.slice(Math.max(0, restart));
  const seen = new Set<string>();
  const products = currentPages
    .flatMap((page) => page.products)
    .filter((product) => {
      if (seen.has(product.ean)) return false;
      seen.add(product.ean);
      return true;
    });

  return {
    ...query,
    data: pages.length ? { ...currentPages[0], products } : undefined,
  };
}
