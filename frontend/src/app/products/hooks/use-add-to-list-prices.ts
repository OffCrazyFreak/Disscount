"use client";

import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type { PinnedStoreDto } from "@/lib/api/schemas/preferences";
import type { AddToListFormData } from "@/app/products/typings/add-to-list";
import {
  getAveragePriceForItem,
  getStorePricesForItem,
  findCheapestStoreForItem,
} from "@/app/(user)/shopping-lists/utils/shopping-list-utils";

/**
 * Loads average/store prices and the cheapest chain for a product once per
 * open, and pre-selects the cheapest chain in the form if none is chosen.
 */
export function useAddToListPrices(
  product: ProductResponse | null | undefined,
  pinnedStores: PinnedStoreDto[] | undefined,
  form: UseFormReturn<AddToListFormData>,
) {
  const [storePrices, setStorePrices] = useState<Record<string, number>>({});
  const [averagePrice, setAveragePrice] = useState<number | null>(null);
  const [cheapestStore, setCheapestStore] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    let ignore = false;

    // Drop the previous product's prices so switching products can't submit stale data mid-fetch.
    setStorePrices({});
    setAveragePrice(null);
    setCheapestStore(null);

    async function fetchPrices() {
      if (!product) return;
      try {
        const tempItem = {
          id: "",
          shoppingListId: "",
          ean: product.ean,
          name: product.name || "",
          brand: product.brand || undefined,
          quantity: product.quantity || undefined,
          unit: product.unit || undefined,
          amount: 1,
          isChecked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedByUserId: null,
          avgPrice: null,
          storePrice: null,
          chainCode: null,
        };

        const [avgPrice, prices, cheapest] = await Promise.all([
          getAveragePriceForItem(tempItem),
          getStorePricesForItem(tempItem),
          findCheapestStoreForItem(tempItem, pinnedStores),
        ]);

        if (ignore) return;

        setAveragePrice(avgPrice);
        setStorePrices(prices);
        setCheapestStore(cheapest);

        if (cheapest && !form.getValues("chainCode")) {
          form.setValue("chainCode", cheapest);
        }
      } catch (error) {
        if (!ignore) console.error("Error fetching prices:", error);
      }
    }

    fetchPrices();

    return () => {
      ignore = true;
    };
  }, [product, pinnedStores, form]);

  return { storePrices, averagePrice, cheapestStore };
}
