import { ViewMode } from "@/typings/view-mode";
import { PeriodOption } from "@/typings/history-period-options";

// One source for the type and its runtime validation, so they can't drift.
export const LOGIN_METHODS = ["email", "google", "facebook"] as const;
export type LoginMethod = (typeof LOGIN_METHODS)[number];

// Product-specific preferences for price history charts
export interface IProductChartPreferences {
  period?: PeriodOption;
  chains?: string[];
}

// Product preferences structure
export interface IProductsPreferences {
  // Product-specific preferences keyed by EAN
  [productEan: string]: IProductChartPreferences | undefined;
}

// Shopping list preferences structure
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

// Main app data structure based on real localStorage example
export interface IAppData {
  viewModes?: Record<string, ViewMode>;
  productsPreferences?: IProductsPreferences;
  shoppingListsPreferences?: Record<string, IShoppingListsPreferences>; // Shopping list ID -> preferences
  lastLoginMethod?: LoginMethod;
  lastSession?: IKnownSession | null; // The session this device last saw, so an offline sign-out can name it
  pendingSignOut?: IPendingSignOut | null; // A sign-out until a session read shows that session is gone
  installBannerDismissedAt?: number; // Epoch ms of last "install app" banner dismissal; re-shown after the snooze window
  storeOptimizeMode?: string; // Preferred store-list sort, shared across all shopping lists
  preferredCameraId?: string; // Manually chosen scanner camera; absent means auto-pick
  formDrafts?: Record<string, IFormDraft>; // Unsaved modal-form drafts keyed per modal
  mapRecentSearches?: string[]; // Last few store-map searches, newest first
  productRecentSearches?: string[]; // Last few product searches, newest first; cleared when a session ends
  watchlistPriceSnapshots?: Record<string, IWatchlistPriceSnapshot>; // User id -> prices at the last watchlist visit, the price-drop badge baseline
  [key: string]: unknown;
}
