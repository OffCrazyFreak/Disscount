"use client";

import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type { PinnedStoreDto } from "@/lib/api/schemas/preferences";
import type { AddToListFormData } from "@/features/products/typings/add-to-list";
import { getAveragePrice } from "@/features/products/utils/product-utils";
import {
  getStorePricesFromProduct,
  findCheapestStoreFromProduct,
} from "@/utils/product-store-prices";

export function useAddToListPrices(
  product: ProductResponse | null | undefined,
  pinnedStores: PinnedStoreDto[] | undefined,
  form: UseFormReturn<AddToListFormData>,
) {
  const storePrices = product ? getStorePricesFromProduct(product) : {};
  const averagePrice = product ? getAveragePrice(product) : null;
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
