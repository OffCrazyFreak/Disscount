"use client";

import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type { PinnedStoreDto } from "@/lib/api/schemas/preferences";
import type { AddToListFormData } from "@/app/[locale]/products/typings/add-to-list";
import { getAveragePrice } from "@/app/[locale]/products/utils/product-utils";
import {
  getStorePricesFromProduct,
  findCheapestStoreFromProduct,
} from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-utils";

/**
 * Derives average/store prices and the cheapest chain from the product the
 * modal already holds, and pre-selects the cheapest chain if none is chosen.
 */
export function useAddToListPrices(
  product: ProductResponse | null | undefined,
  pinnedStores: PinnedStoreDto[] | undefined,
  form: UseFormReturn<AddToListFormData>,
) {
  const storePrices = product ? getStorePricesFromProduct(product) : {};
  const averagePrice = product ? getAveragePrice(product) || null : null;
  const cheapestStore = product
    ? findCheapestStoreFromProduct(product, pinnedStores)
    : null;

  useEffect(() => {
    if (cheapestStore && !form.getValues("chainCode")) {
      form.setValue("chainCode", cheapestStore);
    }
  }, [cheapestStore, form]);

  return { storePrices, averagePrice, cheapestStore };
}
