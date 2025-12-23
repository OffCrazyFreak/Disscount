import { ShoppingListItemDto } from "@/lib/api/types";
import { PinnedStoreDto } from "@/lib/api/schemas/preferences";
import cijenesApi from "@/lib/cijene-api";
import { getAveragePrice } from "@/lib/cijene-api/utils/product-utils";

/**
 * Get store prices for an item by EAN
 * @param item The shopping list item with EAN
 * @returns Record of chain code -> price
 */
export async function getStorePricesForItem(
  item: ShoppingListItemDto
): Promise<Record<string, number>> {
  try {
    // Fetch product pricing data by EAN
    const productData = await cijenesApi.getProductByEan({ ean: item.ean });

    if (!productData.chains || productData.chains.length === 0) {
      return {};
    }

    // Map chain codes to prices
    const storePrices: Record<string, number> = {};
    for (const chain of productData.chains) {
      const chainCode = nameToChainCode(chain.chain);
      if (chainCode) {
        storePrices[chainCode] = parseFloat(chain.avg_price);
      }
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
  item: ShoppingListItemDto
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
  pinnedStores: PinnedStoreDto[] | undefined
): Promise<string | null> {
  if (!pinnedStores || pinnedStores.length === 0) {
    return null;
  }

  try {
    // Fetch product pricing data by EAN
    const productData = await cijenesApi.getProductByEan({ ean: item.ean });

    if (!productData.chains || productData.chains.length === 0) {
      return null;
    }

    // First, try to use the default/preferred store from user preferences (first pinned store)
    const defaultStore = pinnedStores[0];
    if (defaultStore) {
      const defaultStoreName = defaultStore.storeName.toUpperCase();

      // Check if the default store has this item
      for (const chainProduct of productData.chains) {
        const isDefaultStore =
          chainProduct.chain.toUpperCase().includes(defaultStoreName) ||
          defaultStoreName.includes(chainProduct.chain.toUpperCase());

        if (isDefaultStore) {
          // Found the default store with the item, return it
          return nameToChainCode(chainProduct.chain);
        }
      }
    }

    // If default store doesn't have the item, find the cheapest store that does have it
    let cheapestChain = null;
    let cheapestPrice = Infinity;

    for (const chainProduct of productData.chains) {
      const price = parseFloat(chainProduct.avg_price);
      if (price < cheapestPrice) {
        cheapestPrice = price;
        cheapestChain = nameToChainCode(chainProduct.chain);
      }
    }

    return cheapestChain;
  } catch (error) {
    console.error("Error fetching product pricing:", error);
    return null;
  }
}

/**
 * Convert a chain name from the API to the backend enum code
 * E.g., "Plodine" -> "PLODINE", "Konzum" -> "KONZUM"
 */
function nameToChainCode(chainName: string): string {
  const normalized = chainName.toUpperCase().replace(/\s+/g, "_");

  // Handle special cases
  const specialCases: Record<string, string> = {
    JADRANKA: "JADRANKA_TRGOVINA",
    TRGOVINA_KRK: "TRGOVINA_KRK",
  };

  return specialCases[normalized] || normalized;
}
