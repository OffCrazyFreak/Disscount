"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { getPrices } from "@/lib/cijene-api/queries";
import { storePricesQueryKey } from "@/lib/cijene-api/query-hooks";
import type { GetPricesParams } from "@/lib/cijene-api/schemas";
import type { IProductListItem } from "@/app/products/typings/product-list-price";
import {
  summarizeChainPrices,
  summarizeLocationPrices,
} from "@/app/products/utils/product-list-prices";

interface IUseFilteredProductPricesOptions {
  products: ProductResponse[];
  allowedChains: string[] | null;
  selectedLocations: string[];
  selectedSourceCities: string[];
}

export default function useFilteredProductPrices({
  products,
  allowedChains,
  selectedLocations,
  selectedSourceCities,
}: IUseFilteredProductPricesOptions) {
  const eans = products.map((product) => product.ean).join(",");
  const chains = allowedChains?.join(",") ?? "";
  const needsLocationPrices = selectedLocations.length > 0;
  const sourceCities = [...new Set(selectedSourceCities)];

  const priceQueries = useQueries({
    queries:
      needsLocationPrices && eans && chains
        ? sourceCities.map((city) => {
            const params: GetPricesParams = { eans, chains, city };

            return {
              queryKey: storePricesQueryKey(params),
              queryFn: () => getPrices(params),
              staleTime: 6 * 60 * 60 * 1000,
            };
          })
        : [],
    combine: (results) => ({
      storePrices: results.flatMap((result) => result.data?.store_prices ?? []),
      isLoading: results.some((result) => result.isLoading),
      error: results.find((result) => result.error)?.error ?? null,
    }),
  });

  const items = useMemo<IProductListItem[]>(() => {
    if (!needsLocationPrices) {
      return products.map((product) => ({
        product,
        price: summarizeChainPrices(product, allowedChains),
      }));
    }

    if (priceQueries.isLoading || priceQueries.error || !allowedChains) {
      return [];
    }

    const pricesByEan = summarizeLocationPrices(
      priceQueries.storePrices,
      selectedLocations,
      allowedChains,
    );

    return products.flatMap((product) => {
      const price = pricesByEan.get(product.ean);
      return price ? [{ product, price }] : [];
    });
  }, [
    allowedChains,
    needsLocationPrices,
    priceQueries.error,
    priceQueries.isLoading,
    priceQueries.storePrices,
    products,
    selectedLocations,
  ]);

  return {
    items,
    isLoading: priceQueries.isLoading,
    error: priceQueries.error,
  };
}
