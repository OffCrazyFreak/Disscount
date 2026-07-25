"use client";

import { useQueryClient } from "@tanstack/react-query";
import { productByEanQueryKey } from "@/lib/cijene-api";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { openModalUrl } from "@/lib/modal/modal-navigation";

export interface IUseProductModalsResult {
  openAddToList: (product: ProductResponse) => void;
  openWatchlist: (product: ProductResponse) => void;
}

/**
 * Seeds the by-ean cache before opening, since a URL-driven modal takes no props
 * and would otherwise refetch what the caller already had.
 */
export default function useProductModals(): IUseProductModalsResult {
  const queryClient = useQueryClient();

  function seed(product: ProductResponse) {
    queryClient.setQueryData(productByEanQueryKey(product.ean), product);
  }

  return {
    openAddToList: (product) => {
      seed(product);
      openModalUrl({ name: "add-to-list", ean: product.ean });
    },
    openWatchlist: (product) => {
      seed(product);
      openModalUrl({ name: "watchlist", ean: product.ean });
    },
  };
}
