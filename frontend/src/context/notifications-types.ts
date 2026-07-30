export interface INotificationStore {
  chainName: string;
  currentPrice: number;
  discountAmount: number;
  discountPercentage: number;
}

export interface IWatchlistNotification {
  id: string;
  productApiId: string;
  productName: string;
  productBrand: string | null;
  productQuantity: string | null;
  productUnit: string | null;
  discountedStores: INotificationStore[];
  bestDiscountAmount: number;
  bestDiscountPercentage: number;
  bestCurrentPrice: number;
  matchedThresholdCount: number;
  isNew: boolean;
}

export interface INotificationsSummary {
  totalSavings: number;
  totalSavingsPercentage: number;
  itemCount: number;
}

export interface INotificationsContext {
  notifications: IWatchlistNotification[];
  summary: INotificationsSummary;
  isLoading: boolean;
  hasNotifications: boolean;
  hasWatchlistItems: boolean;
  /**
   * One-shot open request from outside the dropdown (e.g. the landing CTA).
   * A counter, not an open flag: the menu's own open state stays local to the
   * component, so a remount can never resurrect a stale open menu.
   */
  openMenuSignal: number;
  requestOpenMenu: () => void;
}
