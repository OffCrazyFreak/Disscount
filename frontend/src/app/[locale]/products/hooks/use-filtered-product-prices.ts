"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { getLocationPrices } from "@/lib/cijene-api/queries";
import type { IProductListItem } from "@/app/[locale]/products/typings/product-list-price-types";
import { summarizeChainPrices } from "@/app/[locale]/products/utils/product-list-prices";
import { normalizeChainCode } from "@/app/[locale]/products/utils/product-filters";

interface IUseFilteredProductPricesOptions {
  products: ProductResponse[];
  allowedChains: string[] | null;
  selectedLocations: string[];
  selectedSourceCities: string[];
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()))]
    .filter(Boolean)
    .sort();
}

export default function useFilteredProductPrices({
  products,
  allowedChains,
  selectedLocations,
  selectedSourceCities,
}: IUseFilteredProductPricesOptions) {
  const eans = sortedUnique(products.map((product) => product.ean)).join(",");
  const chains = sortedUnique(allowedChains ?? []).join(",");
  const cities = sortedUnique(selectedSourceCities);
  const allowedChainKeys = useMemo(
    () =>
      allowedChains === null
        ? null
        : new Set(allowedChains.map(normalizeChainCode)),
    [allowedChains],
  );
  const needsLocationPrices = selectedLocations.length > 0;

  const priceQuery = useQuery({
    queryKey: ["cijene", "prices", "locations", { eans, chains, cities }],
    queryFn: () => getLocationPrices({ eans, chains, cities }),
    enabled:
      needsLocationPrices &&
      Boolean(eans) &&
      Boolean(chains) &&
      cities.length > 0,
    staleTime: 6 * 60 * 60 * 1000,
  });

  const items = useMemo<IProductListItem[]>(() => {
    if (!needsLocationPrices) {
      return products.map((product) => ({
        product,
        price: summarizeChainPrices(product, allowedChainKeys),
      }));
    }

    const prices = priceQuery.data?.prices;
    if (!prices || !allowedChains) return [];

    return products.flatMap((product) => {
      const range = prices[product.ean];

      return range
        ? [
            {
              product,
              price: {
                minPrice: range.min,
                maxPrice: range.max,
                scope: "locations" as const,
              },
            },
          ]
        : [];
    });
  }, [
    allowedChainKeys,
    allowedChains,
    needsLocationPrices,
    priceQuery.data,
    products,
  ]);

  return {
    items,
    isLoading: priceQuery.isLoading,
    // A failed background refresh keeps the prices already shown.
    error: priceQuery.data ? null : priceQuery.error,
    hasPartialError: priceQuery.data?.partial ?? false,
  };
}
