"use client";

import { useMemo } from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import type {
  ProductResponse,
  StorePricesResponse,
} from "@/lib/cijene-api/schemas";
import { getPrices } from "@/lib/cijene-api/queries";
import {
  canonicalizeStorePricesParams,
  storePricesQueryKey,
} from "@/lib/cijene-api/query-hooks";
import type { GetPricesParams } from "@/lib/cijene-api/schemas";
import type { IProductListItem } from "@/app/products/typings/product-list-price";
import {
  summarizeChainPrices,
  summarizeLocationPrices,
} from "@/app/products/utils/product-list-prices";
import { normalizeChainCode } from "@/app/products/utils/product-filters";

interface IUseFilteredProductPricesOptions {
  products: ProductResponse[];
  allowedChains: string[] | null;
  selectedLocations: string[];
  selectedSourceCities: string[];
}

function combinePriceQueries(
  results: UseQueryResult<StorePricesResponse, Error>[],
) {
  const unavailable = results.filter(
    (result) => result.isError && !result.data,
  );

  return {
    storePrices: results.flatMap((result) => result.data?.store_prices ?? []),
    isPending: results.some((result) => result.isPending),
    error:
      results.length > 0 && unavailable.length === results.length
        ? (unavailable[0]?.error ?? null)
        : null,
    hasPartialError:
      unavailable.length > 0 && unavailable.length < results.length,
  };
}

export default function useFilteredProductPrices({
  products,
  allowedChains,
  selectedLocations,
  selectedSourceCities,
}: IUseFilteredProductPricesOptions) {
  const eans = [...new Set(products.map((product) => product.ean))]
    .sort()
    .join(",");
  const chains = [...new Set(allowedChains ?? [])].sort().join(",");
  const allowedChainKeys = useMemo(
    () =>
      allowedChains === null
        ? null
        : new Set(allowedChains.map(normalizeChainCode)),
    [allowedChains],
  );
  const needsLocationPrices = selectedLocations.length > 0;
  const sourceCities = [
    ...new Set(selectedSourceCities.map((city) => city.trim())),
  ]
    .filter(Boolean)
    .sort();

  const priceQueries = useQueries({
    queries:
      needsLocationPrices && eans && chains
        ? sourceCities.map((city) => {
            const params: GetPricesParams = canonicalizeStorePricesParams({
              eans,
              chains,
              city,
            });

            return {
              queryKey: storePricesQueryKey(params),
              queryFn: () => getPrices(params),
              staleTime: 6 * 60 * 60 * 1000,
            };
          })
        : [],
    combine: combinePriceQueries,
  });

  const items = useMemo<IProductListItem[]>(() => {
    if (!needsLocationPrices) {
      return products.map((product) => ({
        product,
        price: summarizeChainPrices(product, allowedChainKeys),
      }));
    }

    if (priceQueries.isPending || priceQueries.error || !allowedChains) {
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
    allowedChainKeys,
    allowedChains,
    needsLocationPrices,
    priceQueries.error,
    priceQueries.isPending,
    priceQueries.storePrices,
    products,
    selectedLocations,
  ]);

  return {
    items,
    isLoading: priceQueries.isPending,
    error: priceQueries.error,
    hasPartialError: priceQueries.hasPartialError,
  };
}
