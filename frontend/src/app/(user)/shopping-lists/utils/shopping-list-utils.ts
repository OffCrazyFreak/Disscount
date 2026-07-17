import { ShoppingListItemDto, ShoppingListDto } from "@/lib/api/types";
import { PinnedStoreDto } from "@/lib/api/schemas/preferences";
import cijenesApi from "@/lib/cijene-api";
import { getAveragePrice } from "@/app/products/utils/product-utils";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";
import { getChainLabel } from "@/utils/labels";
import { formatDate } from "@/utils/strings";

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

/**
 * Modes for optimising the store list on a shopping list.
 * "distance" is not selectable yet (coming soon) and falls back to "products".
 * Kept as a const tuple so the type and localStorage validation share one source.
 */
export const STORE_OPTIMIZE_MODES = [
  "products",
  "basket",
  "total",
  "distance",
] as const;

export type StoreOptimizeMode = (typeof STORE_OPTIMIZE_MODES)[number];

/**
 * Comparator function for sorting store chains by the selected optimisation mode.
 * Pinned stores always come first (user preference), then the chosen metric.
 * @param a First chain to compare
 * @param b Second chain to compare
 * @param pinnedStoreIds Array of pinned store IDs
 * @param mode The optimisation metric to rank by (defaults to product count)
 * @param cheapestCountByChain How many list products are cheapest at each chain
 *        (only used by the "total" mode)
 * @returns Negative if a < b, positive if a > b, 0 if equal
 */
export function compareStoreChains(
  a: ChainProductResponse & { itemCount: number },
  b: ChainProductResponse & { itemCount: number },
  pinnedStoreIds: string[],
  mode: StoreOptimizeMode = "products",
  cheapestCountByChain?: Map<string, number>,
): number {
  // 1. Pinned chains always come first, regardless of mode (user preference)
  const aIsPinned = pinnedStoreIds.includes(a.chain);
  const bIsPinned = pinnedStoreIds.includes(b.chain);
  if (aIsPinned && !bIsPinned) return -1;
  if (!aIsPinned && bIsPinned) return 1;

  const aAvgPrice = parseFloat(a.avg_price);
  const bAvgPrice = parseFloat(b.avg_price);

  // 2. Primary metric depends on the selected mode
  if (mode === "basket") {
    // Cheapest basket that still has everything: complete baskets first (most
    // products), then the cheapest within each completeness tier.
    if (a.itemCount !== b.itemCount) return b.itemCount - a.itemCount;
    if (aAvgPrice !== bAvgPrice) return aAvgPrice - bAvgPrice;
  } else if (mode === "total") {
    // Product-by-product: stores that are the absolute cheapest for the most
    // products rank first, so a shopper hitting several stores grabs the most
    // rock-bottom prices; cheaper overall basket breaks ties.
    const aCount = cheapestCountByChain?.get(a.chain) ?? 0;
    const bCount = cheapestCountByChain?.get(b.chain) ?? 0;
    if (aCount !== bCount) return bCount - aCount;
    if (aAvgPrice !== bAvgPrice) return aAvgPrice - bAvgPrice;
  } else {
    // "products" (default) and "distance" fallback: most products carried first
    if (a.itemCount !== b.itemCount) return b.itemCount - a.itemCount;
  }

  // 3. Tie-breaker: alphabetical (Croatian locale)
  return a.chain.localeCompare(b.chain, "hr", {
    sensitivity: "base",
  });
}

/**
 * How much you save on an item by buying it at the given chain, as a percentage
 * below the highest price for that product across all chains (so a bigger number
 * means a bigger discount at this store). Returns -Infinity when the item is not
 * sold at this chain, so unavailable items sort last.
 */
function getItemSavingPercentAtChain(
  item: ShoppingListItemDto,
  productsData: ProductResponse[],
  chainCode: string,
): number {
  const product = productsData.find((p) => p?.ean === item.ean);
  const chainData = product?.chains?.find((c) => c.chain === chainCode);
  if (!chainData) return -Infinity;

  const price = parseFloat(chainData.avg_price);

  const prices =
    product?.chains
      ?.map((c) => parseFloat(c.avg_price))
      .filter((p) => !isNaN(p)) ?? [];
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  if (!maxPrice || isNaN(price)) return 0;

  return ((maxPrice - price) / maxPrice) * 100;
}

/**
 * Comparator for sorting a store's products: not-yet-bought items first, then by
 * biggest saving at this store (the most-discounted product on top), then name.
 */
export function sortShoppingListItemsByPurchaseAndSaving(
  a: ShoppingListItemDto,
  b: ShoppingListItemDto,
  productsData: ProductResponse[],
  chain: ChainProductResponse,
): number {
  // 1. Not-yet-bought items come first
  if (a.isChecked !== b.isChecked) return a.isChecked ? 1 : -1;

  // 2. Bigger saving at this store first
  const savingA = getItemSavingPercentAtChain(a, productsData, chain.chain);
  const savingB = getItemSavingPercentAtChain(b, productsData, chain.chain);
  if (savingA !== savingB) return savingB - savingA;

  // 3. Alphabetical (Croatian locale)
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

/**
 * Format shopping list as text for sharing
 * Sorts items by checked status, then shop (chainCode), then brand, then name
 * @param shoppingList The shopping list to format
 * @returns Formatted text ready to share
 */
export function formatShoppingListForSharing(
  shoppingList: ShoppingListDto,
): string {
  // Sort items: unchecked first, then by shop, brand, and name
  const sortedItems = [...shoppingList.items].sort((a, b) => {
    // First sort by checked status (unchecked items first)
    if (a.isChecked !== b.isChecked) {
      return a.isChecked ? 1 : -1;
    }

    // Sort by shop (chainCode)
    const shopA = a.chainCode || "";
    const shopB = b.chainCode || "";
    if (shopA !== shopB) {
      return shopA.localeCompare(shopB);
    }

    // Then by brand
    const brandA = a.brand || "";
    const brandB = b.brand || "";
    if (brandA !== brandB) {
      return brandA.localeCompare(brandB);
    }

    // Then by name
    return a.name.localeCompare(b.name);
  });

  // Format the header
  const titleText = `📋 ${shoppingList.title}`;
  const padding = 4; // 2 spaces on each side
  const boxWidth = titleText.length + padding;
  const separator = "═".repeat(boxWidth);

  let shareText = `╔${separator}╗\n`;
  shareText += `   ${titleText}   \n`;
  shareText += `╚${separator}╝\n\n`;
  shareText += `📅 Stvoreno: ${formatDate(shoppingList.createdAt)}\n`;
  shareText += `🔄 Ažurirano: ${formatDate(shoppingList.updatedAt)}\n\n`;

  // Format items
  sortedItems.forEach((item, index) => {
    const number = index + 1;
    const checkbox = item.isChecked ? "[ x ]" : "[  ]";
    const name = item.name;
    const brand = item.brand ? ` - ${item.brand}` : "";
    const unit = item.unit || "";
    const quantity = item.quantity || "";
    const unitAndQuantity =
      unit && quantity
        ? ` (${quantity} ${unit})`
        : unit
          ? ` (${unit})`
          : quantity
            ? ` (${quantity})`
            : "";
    const amount = item.amount > 1 ? ` x${item.amount}` : "";

    // Get store name from chainCode
    const storeName = item.chainCode
      ? getChainLabel(item.chainCode)
      : "";
    const store = storeName ? ` - ${storeName}` : "";

    shareText += `${number}. ${checkbox} ${name}${brand}${unitAndQuantity}${amount}${store}\n`;
  });

  // Add branding footer
  shareText += `\n╔═══════════════════════════════════════════╗\n`;
  shareText += `    ✨ Popis stvoren pomoću Disscount ✨\n`;
  shareText += `       💰 Usporedi cijene i uštedi! 💰\n`;
  shareText += `  🌐 Isprobaj besplatno na disscount.me 🌐\n`;
  shareText += `╚═══════════════════════════════════════════╝\n`;

  return shareText;
}
