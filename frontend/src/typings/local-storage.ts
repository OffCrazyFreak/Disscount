import { ViewMode } from "@/typings/view-mode";
import { PeriodOption } from "@/typings/history-period-options";

// Sign-in methods the user can use, persisted to show a "last used" badge.
// Single source of truth so the type and runtime validation can't drift.
export const LOGIN_METHODS = ["email", "google", "facebook"] as const;
export type LoginMethod = (typeof LOGIN_METHODS)[number];

// Product-specific preferences for price history charts
export interface ProductChartPreferences {
  period?: PeriodOption;
  chains?: string[];
  isPriceHistoryOpen?: boolean;
  storesOpen?: boolean;
}

// Product preferences structure
export interface ProductsPreferences {
  // Product-specific preferences keyed by EAN
  [productEan: string]: ProductChartPreferences | undefined;
}

// Shopping list preferences structure
export interface ShoppingListsPreferences {
  itemsOpen?: boolean;
  priceHistoryOpen?: boolean;
  priceHistoryPeriod?: PeriodOption;
  priceHistoryChains?: string[];
  storesOpen?: boolean;
  [key: string]: unknown;
}

// Main app data structure based on real localStorage example
export interface AppData {
  viewModes?: Record<string, ViewMode>;
  productsPreferences?: ProductsPreferences;
  shoppingListsPreferences?: Record<string, ShoppingListsPreferences>; // Shopping list ID -> preferences
  lastLoginMethod?: LoginMethod;
  [key: string]: unknown;
}
