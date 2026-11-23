import type { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  getAveragePrice,
  getCheapestChainByMinPrice,
} from "@/utils/product-price-utils";

export interface ICategoryPriceFacts {
  chainCount: number;
  /** Lowest and highest product average, each the mean of the chains' average prices for that product */
  lowAverage: number;
  highAverage: number;
  /** Products with at least one chain price, the base the cheapest chain's count is out of */
  priced: number;
  cheapest: { chain: string; wins: number };
}

/** Facts read only from the shown products' live prices, so the intro states nothing the page cannot back. */
export function categoryPriceFacts(
  products: ProductResponse[],
): ICategoryPriceFacts | null {
  const chains = new Set<string>();
  const wins = new Map<string, number>();
  let lowAverage = Infinity;
  let highAverage = -Infinity;

  for (const product of products) {
    const cheapest = getCheapestChainByMinPrice(product.chains);
    if (cheapest === null) continue;

    product.chains.forEach((chain) => chains.add(chain.chain));
    wins.set(cheapest.chain.chain, (wins.get(cheapest.chain.chain) ?? 0) + 1);
    const average = getAveragePrice(product);
    if (average !== null) {
      lowAverage = Math.min(lowAverage, average);
      highAverage = Math.max(highAverage, average);
    }
  }

  if (wins.size === 0) return null;

  // Ties go to the chain code that sorts first, so the sentence does not flip between renders.
  const [chain, chainWins] = [...wins].sort(
    ([codeA, winsA], [codeB, winsB]) =>
      winsB - winsA || codeA.localeCompare(codeB),
  )[0];

  return {
    chainCount: chains.size,
    lowAverage,
    highAverage,
    priced: [...wins.values()].reduce((sum, count) => sum + count, 0),
    cheapest: { chain, wins: chainWins },
  };
}
