import { ViewMode } from "@/typings/view-mode";
import { PeriodOption } from "@/typings/history-period-options";

// Sign-in methods the user can use, persisted to show a "last used" badge.
// Single source of truth so the type and runtime validation can't drift.
export const LOGIN_METHODS = ["email", "google", "facebook"] as const;
export type LoginMethod = (typeof LOGIN_METHODS)[number];

// Product-specific preferences for price history charts
export interface IProductChartPreferences {
  period?: PeriodOption;
  chains?: string[];
  isPriceHistoryOpen?: boolean;
  storesOpen?: boolean;
}

// Product preferences structure
export interface IProductsPreferences {
  // Product-specific preferences keyed by EAN
  [productEan: string]: IProductChartPreferences | undefined;
}

// Shopping list preferences structure
export interface IShoppingListsPreferences {
  itemsOpen?: boolean;
  priceHistoryOpen?: boolean;
  priceHistoryPeriod?: PeriodOption;
  priceHistoryChains?: string[];
  storesOpen?: boolean;
  [key: string]: unknown;
}

// Unsaved modal-form values so users can close a modal and resume later.
// Never contains passwords or base64 images (see useFormDraft's exclude).
export interface IFormDraft {
  savedAt: number;
  values: Record<string, unknown>;
}

// Main app data structure based on real localStorage example
export interface IAppData {
  viewModes?: Record<string, ViewMode>;
  productsPreferences?: IProductsPreferences;
  shoppingListsPreferences?: Record<string, IShoppingListsPreferences>; // Shopping list ID -> preferences
  lastLoginMethod?: LoginMethod;
  installBannerDismissedAt?: number; // Epoch ms of last "install app" banner dismissal; re-shown after the snooze window
  storeOptimizeMode?: string; // Preferred store-list sort, shared across all shopping lists
  preferredCameraId?: string; // Manually chosen scanner camera; absent means auto-pick
  formDrafts?: Record<string, IFormDraft>; // Unsaved modal-form drafts keyed per modal
  [key: string]: unknown;
}
