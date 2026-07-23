import { ShoppingListItemDto } from "@/lib/api/types";
import { PinnedStoreDto } from "@/lib/api/schemas/preferences";
import cijenesApi from "@/lib/cijene-api";
import { getAveragePrice } from "@/app/products/utils/product-utils";

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

    // Map chain codes (cijene slugs) to prices
    const storePrices: Record<string, number> = {};
    for (const chain of productData.chains) {
      storePrices[chain.chain] = parseFloat(chain.avg_price);
    }

    return storePrices;
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

    if (!productData.chains || productData.chains.length === 0) {
      return null;
    }

    // If pinnedStores exists and is not empty, find the cheapest among pinned stores
    if (pinnedStores && pinnedStores.length > 0) {
      let cheapestChain = null;
      let cheapestPrice = Infinity;

      // Check all pinned stores and find the cheapest one
      for (const pinnedStore of pinnedStores) {
        const pinnedStoreName = pinnedStore.storeName.toUpperCase();

        for (const chainProduct of productData.chains) {
          const isPinnedStore =
            chainProduct.chain.toUpperCase().includes(pinnedStoreName) ||
            pinnedStoreName.includes(chainProduct.chain.toUpperCase());

          if (isPinnedStore) {
            const price = parseFloat(chainProduct.avg_price);
            if (price < cheapestPrice) {
              cheapestPrice = price;
              cheapestChain = chainProduct.chain;
            }
          }
        }
      }

      // If we found a pinned store with the item, return the cheapest one
      if (cheapestChain) {
        return cheapestChain;
      }
    }

    // Fall back to finding the cheapest store across all available stores
    let cheapestChain = null;
    let cheapestPrice = Infinity;

    for (const chainProduct of productData.chains) {
      const price = parseFloat(chainProduct.avg_price);
      if (price < cheapestPrice) {
        cheapestPrice = price;
        cheapestChain = chainProduct.chain;
      }
    }

    return cheapestChain;
  } catch (error) {
    console.error("Error fetching product pricing:", error);
    return null;
  }
}
