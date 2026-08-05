import { ShoppingListItemDto } from "@/lib/api/types";
import { PinnedStoreDto } from "@/lib/api/schemas/preferences";
import cijenesApi from "@/lib/cijene-api";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { getAveragePrice } from "@/app/products/utils/product-utils";

// getStorePricesForItem guards chains before use, so the upstream response can
// carry a nullish value despite the declared type. These two are called straight
// from useShoppingListData with no wrapping guard, and a throw there takes the
// whole price calculation down.
export function getStorePricesFromProduct(
  productData: ProductResponse,
): Record<string, number> {
  const storePrices: Record<string, number> = {};

  for (const chain of productData.chains ?? []) {
    storePrices[chain.chain] = parseFloat(chain.avg_price);
  }

  return storePrices;
}

function pickCheapestChain(chains: ProductResponse["chains"]): string | null {
  let cheapestChain: string | null = null;
  let cheapestPrice = Infinity;

  for (const chainProduct of chains) {
    const price = parseFloat(chainProduct.avg_price);

    if (price < cheapestPrice) {
      cheapestPrice = price;
      cheapestChain = chainProduct.chain;
    }
  }

  return cheapestChain;
}

/**
 * Get store prices for an item by EAN
 * @param item The shopping list item with EAN
 * @returns Record of chain code -> price
 */
export async function getStorePricesForItem(
  item: ShoppingListItemDto,
): Promise<Record<string, number>> {
  try {
    // Fetch product pricing data by EAN
    const productData = await cijenesApi.getProductByEan({ ean: item.ean });

    if (!productData.chains || productData.chains.length === 0) {
      return {};
    }

    return getStorePricesFromProduct(productData);
  } catch (error) {
    console.error("Error fetching store prices:", error);
    return {};
  }
}

/**
 * Get the average price for an item across all stores for today
 * @param item The shopping list item with EAN
 * @returns The average price across all stores, or null if not found
 */
export async function getAveragePriceForItem(
  item: ShoppingListItemDto,
): Promise<number | null> {
  try {
    // Fetch product pricing data by EAN
    const productData = await cijenesApi.getProductByEan({ ean: item.ean });

    // Get the average price across all chains
    const avgPrice = getAveragePrice(productData);

    return avgPrice || null;
  } catch (error) {
    console.error("Error fetching product pricing:", error);
    return null;
  }
}

export async function findCheapestStoreForItem(
  item: ShoppingListItemDto,
  pinnedStores: PinnedStoreDto[] | undefined,
): Promise<string | null> {
  try {
    // Fetch product pricing data by EAN
    const productData = await cijenesApi.getProductByEan({ ean: item.ean });

    return findCheapestStoreFromProduct(productData, pinnedStores);
  } catch (error) {
    console.error("Error fetching product pricing:", error);
    return null;
  }
}

export function findCheapestStoreFromProduct(
  productData: ProductResponse,
  pinnedStores: PinnedStoreDto[] | null | undefined,
): string | null {
  if (!productData.chains || productData.chains.length === 0) {
    return null;
  }

  if (pinnedStores && pinnedStores.length > 0) {
    const pinnedNames = pinnedStores.map((store) =>
      store.storeName.toUpperCase(),
    );
    const pinnedChains = productData.chains.filter((chainProduct) => {
      const chainName = chainProduct.chain.toUpperCase();

      return pinnedNames.some(
        (name) => chainName.includes(name) || name.includes(chainName),
      );
    });

    const cheapestPinned = pickCheapestChain(pinnedChains);
    if (cheapestPinned) return cheapestPinned;
  }

  return pickCheapestChain(productData.chains);
}
