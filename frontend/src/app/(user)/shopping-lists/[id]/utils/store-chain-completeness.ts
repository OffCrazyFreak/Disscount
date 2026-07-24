import { ShoppingListItemDto } from "@/lib/api/types";
import { ChainSummary } from "@/app/(user)/shopping-lists/[id]/typings/store-chain-types";

// Only baskets covering every item are comparable; a partial one measures a different set.
function chainsStockingEveryItem(
  allChains: ChainSummary[],
  activeItems: ShoppingListItemDto[],
): ChainSummary[] {
  if (activeItems.length === 0) return [];

  return allChains.filter((chain) => chain.itemCount === activeItems.length);
}

export function computeAbsolutePrices(
  allChains: ChainSummary[],
  activeItems: ShoppingListItemDto[],
): { min: number; max: number } {
  const allPrices = chainsStockingEveryItem(allChains, activeItems).flatMap(
    (chain) => [
      parseFloat(chain.min_price),
      parseFloat(chain.avg_price),
      parseFloat(chain.max_price),
    ],
  );

  if (allPrices.length === 0) return { min: 0, max: 0 };

  return { min: Math.min(...allPrices), max: Math.max(...allPrices) };
}
