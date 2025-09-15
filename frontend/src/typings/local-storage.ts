import { ViewMode } from "@/typings/view-mode";
import { PeriodOption } from "@/app/products/[id]/typings/history-period-options";

// Product-specific preferences for price history charts
export interface ProductChartPreferences {
  period?: PeriodOption;
  chains?: string[];
}

// Price history chart preferences structure
export interface PriceHistoryChartPreferences {
  // Global period setting
  period?: PeriodOption;
  // Product-specific settings keyed by EAN
  [productEan: string]: ProductChartPreferences | PeriodOption | undefined;
}

// Main app data structure based on real localStorage example
export interface AppData {
  accessToken?: string;
  viewModes?: Record<string, ViewMode>;
  priceHistoryChartPreferences?: PriceHistoryChartPreferences;
  [key: string]: unknown;
}
