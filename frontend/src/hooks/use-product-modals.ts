"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  openModalUrl,
  type IOpenModalOptions,
} from "@/lib/modal/modal-navigation";

/**
 * Opens the URL-driven product modals, seeding the by-ean cache first: those
 * modals take only the EAN, so without the seed they refetch what the caller
 * already has and the modal opens empty.
 */
export default function useProductModals(product: ProductResponse) {
  const queryClient = useQueryClient();

  function seed() {
    queryClient.setQueryData(
      CIJENE_QUERY_KEYS.productByEan({ ean: product.ean }),
      product,
    );
  }

  function openAddToList(options?: IOpenModalOptions) {
    seed();
    openModalUrl({ name: "add-to-list", ean: product.ean }, options);
  }

  function openWatchlist(options?: IOpenModalOptions) {
    seed();
    openModalUrl({ name: "watchlist", ean: product.ean }, options);
  }

  function openQuickActions(options?: IOpenModalOptions) {
    seed();
    openModalUrl({ name: "product-actions", ean: product.ean }, options);
  }

  return { openAddToList, openWatchlist, openQuickActions };
}
