import {
  IProductChartPreferences,
  IProductsPreferences,
} from "@/typings/local-storage";
import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";

/**
 * Get price history chart preferences for a specific product.
 */
export function getPriceHistoryPreferences(productEan: string): {
  productsPreferences?: IProductChartPreferences;
} {
  if (typeof window === "undefined") return {};

  try {
    const prefs = getAppStorage().productsPreferences;
    if (!prefs) return {};

    return { productsPreferences: prefs[productEan] };
  } catch {
    return {};
  }
}

/**
 * Set price history chart preferences for a specific product.
 * Replaces the product's stored preferences object entirely.
 */
export function setPriceHistoryPreferences(
  productEan: string,
  preferences: IProductChartPreferences,
) {
  try {
    const existingPrefs = getAppStorage().productsPreferences || {};

    const updatedPrefs: IProductsPreferences = {
      ...existingPrefs,
      [productEan]: preferences,
    };

    setAppStorage({ productsPreferences: updatedPrefs });
  } catch (e) {
    console.error("Failed to set price history preferences", e);
  }
}
