import { ChainProductResponse } from "@/lib/cijene-api/schemas";
import { normalizeForSearch } from "@/utils/strings";

export interface IPriceComparison {
  difference: number;
  percentage: number;
  discountValue: number;
  hasDiscount: boolean;
}

export function calculatePriceComparison(
  baselinePrice: number,
  candidatePrice: number,
): IPriceComparison {
  const difference = Number((candidatePrice - baselinePrice).toFixed(2));
  const percentage =
    baselinePrice > 0
      ? Number(Math.abs((difference / baselinePrice) * 100).toFixed(2))
      : 0;

  return {
    difference,
    percentage,
    discountValue: difference < 0 ? Math.abs(difference) : 0,
    hasDiscount: difference < 0,
  };
}

export function isPreferredChain(
  chain: ChainProductResponse,
  pinnedStoreChainCodes: string[],
): boolean {
  if (pinnedStoreChainCodes.length === 0) {
    return false;
  }

  const chainIdentifier = normalizeForSearch(chain.chain);

  return pinnedStoreChainCodes.some((preferredCode) =>
    chainIdentifier.includes(normalizeForSearch(preferredCode)),
  );
}
