export interface INotificationStore {
  chainName: string;
  currentPrice: number;
  discountAmount: number;
  discountPercentage: number;
  meetsThreshold?: boolean;
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
  /** Header dropdown open state, lifted so other UI can open it (e.g. a CTA) */
  isMenuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}
