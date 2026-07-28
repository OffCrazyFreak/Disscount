"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { productByEanQueryKey } from "@/lib/cijene-api";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { productPath } from "@/utils/product-links";

export function usePrimeProductNavigation() {
  const queryClient = useQueryClient();

  function primeProductNavigation(ean: string, product?: ProductResponse) {
    if (product) {
      queryClient.setQueryData(productByEanQueryKey(ean), product);
    }
  }

  return primeProductNavigation;
}

export default function useProductNavigation() {
  const router = useRouter();
  const primeProductNavigation = usePrimeProductNavigation();

  function navigateToProduct(ean: string, product?: ProductResponse) {
    primeProductNavigation(ean, product);

    router.push(productPath(ean));
  }

  return navigateToProduct;
}
