import { PinnedStoreDto, WatchType, WatchlistItemDto } from "@/lib/api/types";
import {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";
import {
  getAveragePrice,
  getCheapestChainByMinPrice,
  parsePrice,
} from "@/app/products/utils/product-utils";
import { normalizeForSearch } from "@/utils/strings";

export interface GroupedWatchlistItems {
  productApiId: string;
  watchlistItems: WatchlistItemDto[];
}

export interface ScopedDiscountedStore {
  chain: ChainProductResponse;
  currentPrice: number;
  discountAmount: number;
  discountPercentage: number;
}

export interface DiscountInfo {
  // Signed value: negative means discounted vs average, positive means above average.
  preferredDifference: number | null;
  // Absolute percentage only (requested UI behavior).
  preferredPercentage: number | null;
  // Kept for notification compatibility (positive only when discounted).
  preferredDiscount: number | null;
  preferredMinPrice: number | null;
  preferredBestChain: ChainProductResponse | null;
  hasPreferredDiscount: boolean;
  totalDifference: number | null;
  totalPercentage: number | null;
  totalDiscount: number | null;
  totalMinPrice: number | null;
  totalBestChain: ChainProductResponse | null;
  avgPrice: number;
}

export interface WatchlistItemWithProduct {
  productApiId: string;
  watchlistItems: WatchlistItemDto[];
  product: ProductResponse | undefined;
  discountInfo: DiscountInfo | null;
  isLoading: boolean;
  error: Error | null;
}

export function extractPinnedStoreChainCodes(
  pinnedStores: PinnedStoreDto[] | null | undefined,
): string[] {
  if (!pinnedStores || pinnedStores.length === 0) {
    return [];
  }

  return pinnedStores
    .map((store) => {
      const primaryNamePart = store.storeName?.trim().split(/\s+/)[0] || "";

      return normalizeForSearch(primaryNamePart).toUpperCase();
    })
    .filter((chainCode) => chainCode.length > 0);
}

export function groupWatchlistItemsByProduct(
  watchlistItems: WatchlistItemDto[],
): GroupedWatchlistItems[] {
  const groups = new Map<string, WatchlistItemDto[]>();

  for (const watchlistItem of watchlistItems) {
    const existing = groups.get(watchlistItem.productApiId);

    if (existing) {
      existing.push(watchlistItem);
    } else {
      groups.set(watchlistItem.productApiId, [watchlistItem]);
    }
  }

  return Array.from(groups.entries()).map(([productApiId, groupedItems]) => ({
    productApiId,
    watchlistItems: groupedItems,
  }));
}

export function isWatchThresholdReached(
  discountInfo: DiscountInfo,
  watchType: WatchType,
  thresholdValue: number,
  hasPinnedStores: boolean,
): boolean {
  const difference = hasPinnedStores
    ? discountInfo.preferredDifference
    : discountInfo.totalDifference;

  if (difference === null || difference >= 0) {
    return false;
  }

  const discountAmount = hasPinnedStores
    ? discountInfo.preferredDiscount || 0
    : discountInfo.totalDiscount || 0;
  const discountPercentage = hasPinnedStores
    ? discountInfo.preferredPercentage || 0
    : discountInfo.totalPercentage || 0;

  return isDiscountValueAboveThreshold(
    discountAmount,
    discountPercentage,
    watchType,
    thresholdValue,
  );
}

export function isDiscountValueAboveThreshold(
  discountAmount: number,
  discountPercentage: number,
  watchType: WatchType,
  thresholdValue: number,
): boolean {
  if (watchType === WatchType.absolute) {
    return discountAmount >= thresholdValue;
  }

  return discountPercentage >= thresholdValue;
}

interface PriceComparison {
  difference: number;
  percentage: number;
  discountValue: number;
  hasDiscount: boolean;
}

function calculatePriceComparison(
  baselinePrice: number,
  candidatePrice: number,
): PriceComparison {
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

function isPreferredChain(
  chain: ChainProductResponse,
  pinnedStoreChainCodes: string[],
): boolean {
  if (pinnedStoreChainCodes.length === 0) {
    return false;
  }

  const chainCode = normalizeForSearch(chain.code);
  const chainName = normalizeForSearch(chain.chain);
  const normalizedPinnedStoreChainCodes = pinnedStoreChainCodes.map(
    (preferredCode) => normalizeForSearch(preferredCode),
  );

  return normalizedPinnedStoreChainCodes.some((normalizedPreferredCode) => {
    return (
      normalizedPreferredCode === chainCode ||
      chainCode.includes(normalizedPreferredCode) ||
      chainName.includes(normalizedPreferredCode)
    );
  });
}

export function getScopedDiscountedStores(
  product: ProductResponse,
  pinnedStoreChainCodes: string[],
  hasPinnedStores: boolean,
): ScopedDiscountedStore[] {
  const avgPrice = getAveragePrice(product);

  if (avgPrice <= 0) {
    return [];
  }

  const scopedChains = hasPinnedStores
    ? product.chains.filter((chain) =>
        isPreferredChain(chain, pinnedStoreChainCodes),
      )
    : product.chains;

  const discountedStores: ScopedDiscountedStore[] = [];

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
): DiscountInfo {
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

export function getMaxDiscountPercentage(
  discountInfo: DiscountInfo | null,
  hasPinnedStores: boolean,
): number {
  if (!discountInfo) {
    return 0;
  }

  const percentage = hasPinnedStores
    ? discountInfo.preferredPercentage || 0
    : discountInfo.totalPercentage || 0;

  return percentage;
}

export function sortWatchlistItemsByDiscount(
  items: WatchlistItemWithProduct[],
  hasPinnedStores: boolean,
): WatchlistItemWithProduct[] {
  return [...items].sort((a, b) => {
    const maxDiscountA = getMaxDiscountPercentage(
      a.discountInfo,
      hasPinnedStores,
    );
    const maxDiscountB = getMaxDiscountPercentage(
      b.discountInfo,
      hasPinnedStores,
    );

    return maxDiscountB - maxDiscountA;
  });
}
