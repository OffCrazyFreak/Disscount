// Simple wrapper around a single localStorage key to store app-wide data
// Keeps all data under the "Disscount_app" key and exposes helpers
// to read/merge specific fields (so we don't overwrite unrelated settings).
import { ViewMode } from "@/typings/view-mode";
import { PeriodOption } from "@/typings/history-period-options";
import {
  AppData,
  ProductsPreferences,
  ProductChartPreferences,
} from "@/typings/local-storage";

const APP_KEY = "Disscount_app";

export function getAppStorage(): AppData {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(APP_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AppData;
  } catch (e) {
    // If parsing fails, reset to empty object to avoid breaking code paths
    console.warn("Failed to parse app storage, resetting", e);
    try {
      localStorage.removeItem(APP_KEY);
    } catch {}
    return {};
  }
}

export function setAppStorage(partial: AppData) {
  if (typeof window === "undefined") return;
  const current = getAppStorage();
  const merged = { ...current, ...partial };
  try {
    localStorage.setItem(APP_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error("Failed to write app storage", e);
  }
}

export function getAccessToken(): string | null {
  const data = getAppStorage();
  return data.accessToken ?? null;
}

export function setAccessToken(token: string | null | undefined) {
  if (token == null) return removeAccessToken();
  setAppStorage({ accessToken: token });
}

export function removeAccessToken() {
  if (typeof window === "undefined") return;
  const current = getAppStorage();
  if (!current || !Object.prototype.hasOwnProperty.call(current, "accessToken"))
    return;
  const { accessToken, ...rest } = current;
  try {
    // If there are other keys keep them, otherwise remove the whole key
    if (Object.keys(rest).length === 0) {
      localStorage.removeItem(APP_KEY);
    } else {
      localStorage.setItem(APP_KEY, JSON.stringify(rest));
    }
  } catch (e) {
    console.error("Failed to remove accessToken from storage", e);
  }
}

/**
 * Get stored view mode for a specific path.
 * Falls back to provided default ("grid") if missing.
 */
export function getViewMode(path: string, defaultMode: ViewMode = "grid") {
  if (typeof window === "undefined") return defaultMode;
  try {
    const data = getAppStorage();
    return (data.viewModes?.[path] as ViewMode) ?? defaultMode;
  } catch {
    return defaultMode;
  }
}

/**
 * Set view mode for a specific path inside the app storage object.
 */
export function setViewMode(path: string, mode: ViewMode) {
  if (typeof window === "undefined") return;
  try {
    const current = getAppStorage();
    const viewModes = { ...(current.viewModes || {}), [path]: mode };
    setAppStorage({ viewModes });
  } catch (e) {
    console.error("Failed to set view mode", e);
  }
}

/**
 * Get price history chart preferences for a specific product.
 */
export function getPriceHistoryPreferences(productEan: string): {
  productsPreferences?: ProductChartPreferences;
} {
  if (typeof window === "undefined") return {};
  try {
    const data = getAppStorage();
    const prefs = data.productsPreferences;
    if (!prefs) return {};

    return {
      productsPreferences: prefs[productEan] as
        | ProductChartPreferences
        | undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Set price history chart preferences for a specific product.
 */
export function setPriceHistoryPreferences(
  productEan: string,
  preferences: ProductChartPreferences,
) {
  try {
    const current = getAppStorage();
    const existingPrefs = current.productsPreferences || {};

    const updatedPrefs: ProductsPreferences = {
      ...existingPrefs,
      [productEan]: preferences,
    };

    setAppStorage({ productsPreferences: updatedPrefs });
  } catch (e) {
    console.error("Failed to set price history preferences", e);
  }
}

/**
 * Get shopping list items open state for a specific shopping list.
 */
export function getShoppingListItemsOpen(listId: string): boolean {
  const data = getAppStorage();
  // Default to true (open)
  return data.shoppingListsPreferences?.[listId]?.itemsOpen ?? true;
}

/**
 * Set shopping list items open state for a specific shopping list.
 */
export function setShoppingListItemsOpen(listId: string, isOpen: boolean) {
  const data = getAppStorage();
  const currentPrefs = data.shoppingListsPreferences || {};
  const listPrefs = currentPrefs[listId] || {};
  setAppStorage({
    shoppingListsPreferences: {
      ...currentPrefs,
      [listId]: {
        ...listPrefs,
        itemsOpen: isOpen,
      },
    },
  });
}

/**
 * Get shopping list price history open state for a specific shopping list.
 */
export function getShoppingListPriceHistoryOpen(listId: string): boolean {
  const data = getAppStorage();
  // Default to false (closed)
  return data.shoppingListsPreferences?.[listId]?.priceHistoryOpen ?? false;
}

/**
 * Set shopping list price history open state for a specific shopping list.
 */
export function setShoppingListPriceHistoryOpen(
  listId: string,
  isOpen: boolean,
) {
  const data = getAppStorage();
  const currentPrefs = data.shoppingListsPreferences || {};
  const listPrefs = currentPrefs[listId] || {};
  setAppStorage({
    shoppingListsPreferences: {
      ...currentPrefs,
      [listId]: {
        ...listPrefs,
        priceHistoryOpen: isOpen,
      },
    },
  });
}

/**
 * Get shopping list price history period for a specific shopping list.
 */
export function getShoppingListPriceHistoryPeriod(
  listId: string,
): PeriodOption {
  const data = getAppStorage();
  // Default to '1W'
  return data.shoppingListsPreferences?.[listId]?.priceHistoryPeriod ?? "1W";
}

/**
 * Set shopping list price history period for a specific shopping list.
 */
export function setShoppingListPriceHistoryPeriod(
  listId: string,
  period: PeriodOption,
) {
  const data = getAppStorage();
  const currentPrefs = data.shoppingListsPreferences || {};
  const listPrefs = currentPrefs[listId] || {};
  setAppStorage({
    shoppingListsPreferences: {
      ...currentPrefs,
      [listId]: {
        ...listPrefs,
        priceHistoryPeriod: period,
      },
    },
  });
}

/**
 * Get shopping list price history selected chains for a specific shopping list.
 */
export function getShoppingListPriceHistoryChains(
  listId: string,
): string[] | undefined {
  const data = getAppStorage();
  return data.shoppingListsPreferences?.[listId]?.priceHistoryChains;
}

/**
 * Set shopping list price history selected chains for a specific shopping list.
 */
export function setShoppingListPriceHistoryChains(
  listId: string,
  chains: string[],
) {
  const data = getAppStorage();
  const currentPrefs = data.shoppingListsPreferences || {};
  const listPrefs = currentPrefs[listId] || {};
  setAppStorage({
    shoppingListsPreferences: {
      ...currentPrefs,
      [listId]: {
        ...listPrefs,
        priceHistoryChains: chains,
      },
    },
  });
}

/**
 * Get shopping list stores open state for a specific shopping list.
 */
export function getShoppingListStoresOpen(listId: string): boolean {
  const data = getAppStorage();
  // Default to true (open)
  return data.shoppingListsPreferences?.[listId]?.storesOpen ?? true;
}

/**
 * Set shopping list stores open state for a specific shopping list.
 */
export function setShoppingListStoresOpen(listId: string, isOpen: boolean) {
  const data = getAppStorage();
  const currentPrefs = data.shoppingListsPreferences || {};
  const listPrefs = currentPrefs[listId] || {};
  setAppStorage({
    shoppingListsPreferences: {
      ...currentPrefs,
      [listId]: {
        ...listPrefs,
        storesOpen: isOpen,
      },
    },
  });
}

/**
 * Get product stores open state for a specific product.
 */
export function getProductStoresOpen(productEan: string): boolean {
  const data = getAppStorage();
  // Default to true (open)
  return data.productsPreferences?.[productEan]?.storesOpen ?? true;
}

/**
 * Set product stores open state for a specific product.
 */
export function setProductStoresOpen(productEan: string, isOpen: boolean) {
  const data = getAppStorage();
  const currentPrefs = data.productsPreferences || {};
  const productPrefs = currentPrefs[productEan] || {};
  setAppStorage({
    productsPreferences: {
      ...currentPrefs,
      [productEan]: {
        ...productPrefs,
        storesOpen: isOpen,
      },
    },
  });
}
