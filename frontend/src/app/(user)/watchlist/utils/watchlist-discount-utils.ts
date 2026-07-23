import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  getAveragePrice,
  getCheapestChainByMinPrice,
  parsePrice,
} from "@/app/products/utils/product-utils";
import {
  IDiscountInfo,
  IScopedDiscountedStore,
} from "@/app/(user)/watchlist/utils/watchlist-types";
import {
  calculatePriceComparison,
  isPreferredChain,
} from "@/app/(user)/watchlist/utils/watchlist-price-utils";

export function getScopedDiscountedStores(
  product: ProductResponse,
  pinnedStoreChainCodes: string[],
  hasPinnedStores: boolean,
): IScopedDiscountedStore[] {
  const avgPrice = getAveragePrice(product);

  if (avgPrice <= 0) {
    return [];
  }

  const scopedChains = hasPinnedStores
    ? product.chains.filter((chain) =>
        isPreferredChain(chain, pinnedStoreChainCodes),
      )
    : product.chains;

  const discountedStores: IScopedDiscountedStore[] = [];

  for (const chain of scopedChains) {
    const currentPrice = parsePrice(chain.min_price);

    if (currentPrice === null) {
      continue;
    }

    const comparison = calculatePriceComparison(avgPrice, currentPrice);

    if (!comparison.hasDiscount) {
      continue;
    }

    discountedStores.push({
      chain,
      currentPrice,
      discountAmount: comparison.discountValue,
      discountPercentage: comparison.percentage,
    });
  }

  return discountedStores.sort((a, b) => a.currentPrice - b.currentPrice);
}

export function calculateDiscountInfo(
  product: ProductResponse,
  pinnedStoreChainCodes: string[],
): IDiscountInfo {
  const avgPrice = getAveragePrice(product);

  const cheapestOverall = getCheapestChainByMinPrice(product.chains);
  const preferredChains = product.chains.filter((chain) =>
    isPreferredChain(chain, pinnedStoreChainCodes),
  );
  const cheapestPreferred = getCheapestChainByMinPrice(preferredChains);

  if (avgPrice <= 0) {
    return {
      preferredDifference: null,
      preferredPercentage: null,
      preferredDiscount: null,
      preferredMinPrice: cheapestPreferred?.price ?? null,
      preferredBestChain: cheapestPreferred?.chain ?? null,
      hasPreferredDiscount: false,
      totalDifference: null,
      totalPercentage: null,
      totalDiscount: null,
      totalMinPrice: cheapestOverall?.price ?? null,
      totalBestChain: cheapestOverall?.chain ?? null,
      avgPrice,
    };
  }

  const overallComparison = cheapestOverall
    ? calculatePriceComparison(avgPrice, cheapestOverall.price)
    : null;

  const preferredComparison = cheapestPreferred
    ? calculatePriceComparison(avgPrice, cheapestPreferred.price)
    : null;

  return {
    preferredDifference: preferredComparison?.difference ?? null,
    preferredPercentage: preferredComparison?.percentage ?? null,
    preferredDiscount: preferredComparison?.discountValue ?? null,
    preferredMinPrice: cheapestPreferred?.price ?? null,
    preferredBestChain: cheapestPreferred?.chain ?? null,
    hasPreferredDiscount: preferredComparison?.hasDiscount ?? false,
    totalDifference: overallComparison?.difference ?? null,
    totalPercentage: overallComparison?.percentage ?? null,
    totalDiscount: overallComparison?.discountValue ?? null,
    totalMinPrice: cheapestOverall?.price ?? null,
    totalBestChain: cheapestOverall?.chain ?? null,
    avgPrice,
  };
}
