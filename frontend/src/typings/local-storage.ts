import { ViewMode } from "@/typings/view-mode";
import { PeriodOption } from "@/typings/history-period-options";

// Product-specific preferences for price history charts
export interface ProductChartPreferences {
  period?: PeriodOption;
  chains?: string[];
}

// Price history chart preferences structure
export interface PriceHistoryChartPreferences {
  // Product-specific preferences keyed by EAN
  [productEan: string]: ProductChartPreferences | undefined;
}

// Main app data structure based on real localStorage example
export interface AppData {
  accessToken?: string;
  viewModes?: Record<string, ViewMode>;
  priceHistoryChartPreferences?: PriceHistoryChartPreferences;
  [key: string]: unknown;
}
