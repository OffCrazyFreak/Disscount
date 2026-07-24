"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { productByEanQueryKey } from "@/lib/cijene-api";
import { ProductResponse } from "@/lib/cijene-api/schemas";

export default function useProductNavigation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  function navigateToProduct(ean: string, product?: ProductResponse) {
    if (product) {
      queryClient.setQueryData(productByEanQueryKey(ean), product);
    }

    router.push(`/products/${encodeURIComponent(ean)}`);
  }

  return navigateToProduct;
}
