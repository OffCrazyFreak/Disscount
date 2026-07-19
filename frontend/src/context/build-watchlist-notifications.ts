import { UseQueryResult } from "@tanstack/react-query";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  calculateDiscountInfo,
  getScopedDiscountedStores,
  GroupedWatchlistItems,
  isDiscountValueAboveThreshold,
  isWatchThresholdReached,
} from "@/app/(user)/watchlist/utils/watchlist-utils";
import { getChainLabel } from "@/utils/labels";
import { NotificationsSummary, WatchlistNotification } from "./notifications-types";

interface IBuildNotificationsResult {
  notifications: WatchlistNotification[];
  summary: NotificationsSummary;
}

export function buildWatchlistNotifications(
  groupedWatchlistItems: GroupedWatchlistItems[],
  productQueries: UseQueryResult<ProductResponse>[],
  pinnedStoreChainCodes: string[],
  hasPinnedStores: boolean,
): IBuildNotificationsResult {
  const notificationsList: WatchlistNotification[] = [];
  let totalSavings = 0;
  let totalOriginalPrice = 0;

  groupedWatchlistItems.forEach((groupedItem, index) => {
    const queryResult = productQueries[index];
    const product = queryResult?.data as ProductResponse | undefined;

    if (!product || queryResult?.isLoading) return;

    const discountInfo = calculateDiscountInfo(product, pinnedStoreChainCodes);

    const matchedThresholds = groupedItem.watchlistItems.filter(
      (watchlistItem) =>
        isWatchThresholdReached(
          discountInfo,
          watchlistItem.watchType,
          watchlistItem.thresholdValue,
          hasPinnedStores,
        ),
    );

    if (matchedThresholds.length === 0) {
      return;
    }

    const discountedStores = getScopedDiscountedStores(
      product,
      pinnedStoreChainCodes,
      hasPinnedStores,
    )
      .filter((store) =>
        groupedItem.watchlistItems.some((watchlistItem) =>
          isDiscountValueAboveThreshold(
            store.discountAmount,
            store.discountPercentage,
            watchlistItem.watchType,
            watchlistItem.thresholdValue,
          ),
        ),
      )
      .map((store) => ({
        chainName: getChainLabel(store.chain.chain),
        currentPrice: store.currentPrice,
        discountAmount: store.discountAmount,
        discountPercentage: store.discountPercentage,
      }))
      .sort((a, b) => {
        if (b.discountAmount !== a.discountAmount) {
          return b.discountAmount - a.discountAmount;
        }

        if (b.discountPercentage !== a.discountPercentage) {
          return b.discountPercentage - a.discountPercentage;
        }

        return a.currentPrice - b.currentPrice;
      });

    if (discountedStores.length === 0) {
      return;
    }

    const bestStore = discountedStores[0];

    notificationsList.push({
      id: groupedItem.productApiId,
      productApiId: groupedItem.productApiId,
      productName: product.name || "Nepoznati proizvod",
      productBrand: product.brand,
      productQuantity: product.quantity,
      productUnit: product.unit,
      discountedStores,
      bestDiscountAmount: bestStore.discountAmount,
      bestDiscountPercentage: bestStore.discountPercentage,
      bestCurrentPrice: bestStore.currentPrice,
      matchedThresholdCount: matchedThresholds.length,
      isNew: true, // All frontend notifications are "new"
    });

    // Summary is based on best store per product.
    totalSavings += bestStore.discountAmount;
    totalOriginalPrice += discountInfo.avgPrice;
  });

  const totalSavingsPercentage =
    totalOriginalPrice > 0
      ? Math.round((totalSavings / totalOriginalPrice) * 100)
      : 0;

  return {
    notifications: notificationsList,
    summary: {
      totalSavings,
      totalSavingsPercentage,
      itemCount: notificationsList.length,
    },
  };
}
