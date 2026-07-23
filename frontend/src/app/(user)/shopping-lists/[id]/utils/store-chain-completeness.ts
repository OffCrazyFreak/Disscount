import { ShoppingListItemDto } from "@/lib/api/types";
import {
  ChainSummary,
  ICompleteStoresAnalysis,
} from "@/app/(user)/shopping-lists/[id]/typings/store-chain-types";

// A partial basket would always look cheaper, so only complete chains compare.
function completeChains(
  allChains: ChainSummary[],
  activeItems: ShoppingListItemDto[],
): ChainSummary[] {
  if (activeItems.length === 0) return [];

  return allChains.filter((chain) => chain.itemCount === activeItems.length);
}

function extremeByAvgPrice(
  chains: ChainSummary[],
  isBetter: (candidate: number, incumbent: number) => boolean,
): ChainSummary {
  return chains.reduce((best, chain) =>
    isBetter(parseFloat(chain.avg_price), parseFloat(best.avg_price))
      ? chain
      : best,
  );
}

export function findCompleteStoresAnalysis(
  allChains: ChainSummary[],
  activeItems: ShoppingListItemDto[],
): ICompleteStoresAnalysis {
  const chains = completeChains(allChains, activeItems);

  if (chains.length === 0) {
    return { bestStore: null, worstStore: null };
  }

  return {
    bestStore: extremeByAvgPrice(
      chains,
      (candidate, incumbent) => candidate < incumbent,
    ),
    worstStore: extremeByAvgPrice(
      chains,
      (candidate, incumbent) => candidate > incumbent,
    ),
  };
}

export function computeAbsolutePrices(
  allChains: ChainSummary[],
  activeItems: ShoppingListItemDto[],
): { min: number; max: number } {
  const allPrices = completeChains(allChains, activeItems).flatMap((chain) => [
    parseFloat(chain.min_price),
    parseFloat(chain.avg_price),
    parseFloat(chain.max_price),
  ]);

  if (allPrices.length === 0) return { min: 0, max: 0 };

  return { min: Math.min(...allPrices), max: Math.max(...allPrices) };
}
