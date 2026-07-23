import { ShoppingListItemDto } from "@/lib/api/types";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";

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
    // Completeness first, then price within each tier.
    if (a.itemCount !== b.itemCount) return b.itemCount - a.itemCount;
    if (aAvgPrice !== bAvgPrice) return aAvgPrice - bAvgPrice;
  } else if (mode === "total") {
    // Most rock-bottom prices first, for a shopper willing to hit several stores.
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
