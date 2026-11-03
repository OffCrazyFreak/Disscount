import {
  IProductChartPreferences,
  IProductsPreferences,
} from "@/typings/local-storage";
import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";

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
