"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useQueries } from "@tanstack/react-query";
import { watchlistService } from "@/lib/api";
import { getProductByEan } from "@/lib/cijene-api";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { useUser } from "@/context/user-context";
import {
  calculateDiscountInfo,
  extractPinnedStoreChainCodes,
  getScopedDiscountedStores,
  groupWatchlistItemsByProduct,
  isDiscountValueAboveThreshold,
  isWatchThresholdReached,
} from "@/app/(user)/watchlist/utils/watchlist-utils";
import { storeNamesMap } from "@/constants/name-mappings";
import { toPascalCase } from "@/utils/strings";

export interface NotificationStore {
  chainName: string;
  currentPrice: number;
  discountAmount: number;
  discountPercentage: number;
}

export interface WatchlistNotification {
  id: string;
  productApiId: string;
  productName: string;
  productBrand: string | null;
  productQuantity: string | null;
  productUnit: string | null;
  discountedStores: NotificationStore[];
  bestDiscountAmount: number;
  bestDiscountPercentage: number;
  bestCurrentPrice: number;
  matchedThresholdCount: number;
  isNew: boolean;
}

interface NotificationsSummary {
  totalSavings: number;
  totalSavingsPercentage: number;
  itemCount: number;
}

interface INotificationsContext {
  notifications: WatchlistNotification[];
  summary: NotificationsSummary;
  isLoading: boolean;
  hasNotifications: boolean;
}

const NotificationsContext = createContext<INotificationsContext | undefined>(
  undefined,
);

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({
  children,
}: NotificationsProviderProps) {
  const { user, isAuthenticated } = useUser();

  // Fetch watchlist items
  const { data: watchlistItems = [], isLoading: watchlistLoading } =
    watchlistService.useGetCurrentUserWatchlist();

  const groupedWatchlistItems = useMemo(
    () => groupWatchlistItemsByProduct(watchlistItems),
    [watchlistItems],
  );

  const pinnedStoreChainCodes = useMemo(
    () => extractPinnedStoreChainCodes(user?.pinnedStores),
    [user?.pinnedStores],
  );

  const hasPinnedStores = pinnedStoreChainCodes.length > 0;

  // Progressive loading: fetch product data per grouped product
  const productQueries = useQueries({
    queries: groupedWatchlistItems.map((item) => ({
      queryKey: ["cijene", "product", "ean", item.productApiId],
      queryFn: () => getProductByEan({ ean: item.productApiId }),
      enabled: !!item.productApiId && isAuthenticated,
      staleTime: 6 * 60 * 60 * 1000, // 6 hours
    })),
  });

  // Generate grouped notifications from products with threshold-matched discounts
  const { notifications, summary } = useMemo(() => {
    const notificationsList: WatchlistNotification[] = [];
    let totalSavings = 0;
    let totalOriginalPrice = 0;

    groupedWatchlistItems.forEach((groupedItem, index) => {
      const queryResult = productQueries[index];
      const product = queryResult?.data as ProductResponse | undefined;

      if (!product || queryResult?.isLoading) return;

      const discountInfo = calculateDiscountInfo(
        product,
        pinnedStoreChainCodes,
      );

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
          chainName:
            storeNamesMap[store.chain.code.toLowerCase().replace(/_/g, "-")] ||
            storeNamesMap[store.chain.chain.toLowerCase().replace(/_/g, "-")] ||
            toPascalCase(store.chain.chain.toLowerCase()),
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

    // Calculate overall savings percentage
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
  }, [
    groupedWatchlistItems,
    productQueries,
    pinnedStoreChainCodes,
    hasPinnedStores,
  ]);

  const isLoading = watchlistLoading || productQueries.some((q) => q.isLoading);

  const value: INotificationsContext = {
    notifications,
    summary,
    isLoading,
    hasNotifications: notifications.length > 0,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return context;
}
