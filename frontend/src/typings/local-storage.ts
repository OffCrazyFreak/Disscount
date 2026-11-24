import { ViewMode } from "@/typings/view-mode";
import { PeriodOption } from "@/typings/history-period-options";

// One source for the type and its runtime validation, so they can't drift.
export const LOGIN_METHODS = ["email", "google", "facebook"] as const;
export type LoginMethod = (typeof LOGIN_METHODS)[number];

export interface IProductChartPreferences {
  period?: PeriodOption;
  chains?: string[];
}

export interface IProductsPreferences {
  [productEan: string]: IProductChartPreferences | undefined;
}

export interface IShoppingListsPreferences {
  priceHistoryPeriod?: PeriodOption;
  priceHistoryChains?: string[];
  groupByStore?: boolean;
  [key: string]: unknown;
}

// Never holds passwords or base64 images; see useFormDraft's exclude.
export interface IFormDraft {
  savedAt: number;
  // The cache identity that wrote it; drafts written before this field never match one.
  owner: string;
  values: Record<string, unknown>;
}

// Watched product EAN -> best price in the user's store scope, in cents
export type WatchlistPriceSnapshot = Record<string, number>;

export interface IWatchlistPriceSnapshot {
  // The pinned chain codes the prices were read in; a different scope is a rebase, not a drop
  scope: string;
  prices: WatchlistPriceSnapshot;
}

export interface IKnownSession {
  userId: string;
  sessionId: string | null; // Null when signed out before this device saw the session's id
}

export interface IPendingSignOut extends IKnownSession {
  isServerEnded: boolean; // Kept until a session read confirms it, so a stale answer cannot sign back in
}

export interface IAppData {
  viewModes?: Record<string, ViewMode>;
  productsPreferences?: IProductsPreferences;
  shoppingListsPreferences?: Record<string, IShoppingListsPreferences>;
  lastLoginMethod?: LoginMethod;
  lastSession?: IKnownSession | null; // The session this device last saw, so an offline sign-out can name it
  pendingSignOut?: IPendingSignOut | null; // A sign-out until a session read shows that session is gone
  installBannerDismissedAt?: number;
  storeOptimizeMode?: string;
  preferredCameraId?: string; // Manually chosen scanner camera; absent means auto-pick
  formDrafts?: Record<string, IFormDraft>;
  mapRecentSearches?: string[];
  productRecentSearches?: string[]; // Cleared when a session ends
  watchlistPriceSnapshots?: Record<string, IWatchlistPriceSnapshot>; // User id -> prices at the last watchlist visit
  [key: string]: unknown;
}
