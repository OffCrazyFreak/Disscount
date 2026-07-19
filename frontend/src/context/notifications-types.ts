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

export interface NotificationsSummary {
  totalSavings: number;
  totalSavingsPercentage: number;
  itemCount: number;
}

export interface INotificationsContext {
  notifications: WatchlistNotification[];
  summary: NotificationsSummary;
  isLoading: boolean;
  hasNotifications: boolean;
  hasWatchlistItems: boolean;
}
