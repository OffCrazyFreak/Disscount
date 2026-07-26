"use client";

import { useQueryClient } from "@tanstack/react-query";
import { productByEanQueryKey } from "@/lib/cijene-api";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { openModalUrl } from "@/lib/modal/modal-navigation";

/**
 * Opens the URL-driven product modals, seeding the by-ean cache first: those
 * modals take no props, so without the seed they refetch what the caller already
 * has and the modal opens empty.
 */
export default function useProductModals(product: ProductResponse) {
  const queryClient = useQueryClient();

  function seed() {
    queryClient.setQueryData(productByEanQueryKey(product.ean), product);
  }

  function openAddToList() {
    seed();
    openModalUrl({ name: "add-to-list", ean: product.ean });
  }

  function openWatchlist() {
    seed();
    openModalUrl({ name: "watchlist", ean: product.ean });
  }

  function openQuickActions() {
    seed();
    openModalUrl({ name: "product-actions", ean: product.ean });
  }

  return { openAddToList, openWatchlist, openQuickActions };
}
