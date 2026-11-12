import {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";
import {
  getAveragePrice,
  getCheapestChainByMinPrice,
  parsePrice,
} from "@/utils/product-price-utils";
import {
  IDiscountInfo,
  IScopedDiscountedStore,
} from "@/lib/watchlist/watchlist-types";
import {
  calculatePriceComparison,
  isPreferredChain,
} from "@/lib/watchlist/watchlist-price-utils";

interface ICheapestChain {
  chain: ChainProductResponse;
  price: number;
}

export function getScopedDiscountedStores(
  product: ProductResponse,
  pinnedStoreChainCodes: string[],
  hasPinnedStores: boolean,
): IScopedDiscountedStore[] {
  const avgPrice = getAveragePrice(product) ?? 0;

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

function summarizeCheapest(avgPrice: number, cheapest: ICheapestChain | null) {
  const comparison =
    avgPrice > 0 && cheapest
      ? calculatePriceComparison(avgPrice, cheapest.price)
      : null;

  return {
    difference: comparison?.difference ?? null,
    percentage: comparison?.percentage ?? null,
    discount: comparison?.discountValue ?? null,
    hasDiscount: comparison?.hasDiscount ?? false,
    minPrice: cheapest?.price ?? null,
    bestChain: cheapest?.chain ?? null,
  };
}

export function calculateDiscountInfo(
  product: ProductResponse,
  pinnedStoreChainCodes: string[],
): IDiscountInfo {
  const avgPrice = getAveragePrice(product) ?? 0;

  const preferredChains = product.chains.filter((chain) =>
    isPreferredChain(chain, pinnedStoreChainCodes),
  );
  const preferred = summarizeCheapest(
    avgPrice,
    getCheapestChainByMinPrice(preferredChains),
  );
  const total = summarizeCheapest(
    avgPrice,
    getCheapestChainByMinPrice(product.chains),
  );

  return {
    preferredDifference: preferred.difference,
    preferredPercentage: preferred.percentage,
    preferredDiscount: preferred.discount,
    preferredMinPrice: preferred.minPrice,
    preferredBestChain: preferred.bestChain,
    hasPreferredDiscount: preferred.hasDiscount,
    totalDifference: total.difference,
    totalPercentage: total.percentage,
    totalDiscount: total.discount,
    totalMinPrice: total.minPrice,
    totalBestChain: total.bestChain,
    avgPrice,
  };
}
