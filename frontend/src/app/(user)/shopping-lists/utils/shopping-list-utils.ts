import { ShoppingListItemDto } from "@/lib/api/types";
import { PinnedStoreDto } from "@/lib/api/schemas/preferences";
import cijenesApi from "@/lib/cijene-api";
import { getAveragePrice } from "@/app/products/utils/product-utils";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";

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
              cheapestChain = nameToChainCode(chainProduct.chain);
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

/**
 * Comparator function for sorting store chains by multiple criteria
 * @param a First chain to compare
 * @param b Second chain to compare
 * @param pinnedStoreIds Array of pinned store IDs
 * @returns Negative if a < b, positive if a > b, 0 if equal
 */
export function compareStoreChains(
  a: ChainProductResponse & { itemCount: number },
  b: ChainProductResponse & { itemCount: number },
  pinnedStoreIds: string[],
): number {
  // Check if chains are pinned
  const aIsPinned = pinnedStoreIds.includes(a.chain);
  const bIsPinned = pinnedStoreIds.includes(b.chain);

  // 1. Pinned chains come first
  if (aIsPinned && !bIsPinned) return -1;
  if (!aIsPinned && bIsPinned) return 1;

  // 2. If both are pinned or both are not pinned, sort by item count (highest first)
  const aItemCount = a.itemCount;
  const bItemCount = b.itemCount;
  if (aItemCount !== bItemCount) return bItemCount - aItemCount;

  // 3. If item counts are equal, sort by average price (lowest first)
  const aAvgPrice = parseFloat(a.avg_price);
  const bAvgPrice = parseFloat(b.avg_price);
  if (aAvgPrice !== bAvgPrice) return aAvgPrice - bAvgPrice;

  // If all criteria are equal, sort alphabetically
  return a.chain.localeCompare(b.chain, "hr", {
    sensitivity: "base",
  });
}

/**
 * Comparator function for sorting shopping list items by availability and name.
 * Available items come first, then sorted alphabetically within each group.
 */
export function sortShoppingListItemsByAvailabilityAndName(
  a: ShoppingListItemDto,
  b: ShoppingListItemDto,
  productsData: ProductResponse[],
  chain: ChainProductResponse,
): number {
  // Find product data for both items
  const productA = productsData.find((p) => p?.ean === a.ean);
  const productB = productsData.find((p) => p?.ean === b.ean);

  // Find chain data for both items
  const chainDataA = productA?.chains?.find(
    (c: ChainProductResponse) => c.chain === chain.chain,
  );
  const chainDataB = productB?.chains?.find(
    (c: ChainProductResponse) => c.chain === chain.chain,
  );

  // Check availability
  const isAvailableA = Boolean(chainDataA);
  const isAvailableB = Boolean(chainDataB);

  // Available items come first
  if (isAvailableA && !isAvailableB) return -1;
  if (!isAvailableA && isAvailableB) return 1;

  // Within each group, sort alphabetically
  return a.name.localeCompare(b.name, "hr", {
    sensitivity: "base",
  });
}

/**
 * Calculate shopping list price statistics
 * Total always uses API prices to remain constant
 * Spent uses DB prices for checked items
 */
export function calculateShoppingListStats(
  items: Array<{
    id: string;
    amount?: number | null;
    isChecked: boolean;
    storePrice?: number | null;
    avgPrice?: number | null;
  }>,
  averagePrices: Record<string, number>,
) {
  let minTotal = 0;
  let avgTotal = 0;
  let maxTotal = 0;
  let minToSpend = 0;
  let avgToSpend = 0;
  let maxToSpend = 0;
  let moneySpent = 0;
  let potentialCostForChecked = 0;
  let checkedCount = 0;

  for (const item of items) {
    const amount = item.amount || 1;
    const avgPrice = averagePrices[item.id] || 0;

    // Total always uses API prices (estimations)
    if (avgPrice > 0) {
      const estimatedMin = avgPrice * 0.9;
      const estimatedMax = avgPrice * 1.1;

      minTotal += estimatedMin * amount;
      avgTotal += avgPrice * amount;
      maxTotal += estimatedMax * amount;
    }

    if (item.isChecked) {
      checkedCount++;
      const itemPrice = item.storePrice || 0;
      const itemAvgPrice = item.avgPrice || 0;

      moneySpent += itemPrice * amount;
      potentialCostForChecked += itemAvgPrice * amount;
    } else {
      // For unchecked items, calculate remaining to spend
      if (avgPrice > 0) {
        const estimatedMin = avgPrice * 0.9;
        const estimatedMax = avgPrice * 1.1;

        minToSpend += estimatedMin * amount;
        avgToSpend += avgPrice * amount;
        maxToSpend += estimatedMax * amount;
      }
    }
  }

  const savedAmount = potentialCostForChecked - moneySpent;
  const savedPercentage =
    potentialCostForChecked > 0
      ? (savedAmount / potentialCostForChecked) * 100
      : 0;

  return {
    minTotal,
    avgTotal,
    maxTotal,
    minToSpend,
    avgToSpend,
    maxToSpend,
    moneySpent,
    checkedCount,
    totalCount: items.length,
    savedAmount,
    savedPercentage,
    potentialCostForChecked,
  };
}
