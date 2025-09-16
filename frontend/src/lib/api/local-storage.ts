// Simple wrapper around a single localStorage key to store app-wide data
// Keeps all data under the "Disscount_app" key and exposes helpers
// to read/merge specific fields (so we don't overwrite unrelated settings).
import { ViewMode } from "@/typings/view-mode";
import { AppData } from "@/typings/local-storage";
import {
  PriceHistoryChartPreferences,
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
  productPreferences?: ProductChartPreferences;
} {
  if (typeof window === "undefined") return {};
  try {
    const data = getAppStorage();
    const prefs = data.priceHistoryChartPreferences;
    if (!prefs) return {};

    return {
      productPreferences: prefs[productEan] as
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
  preferences: ProductChartPreferences
) {
  try {
    const current = getAppStorage();
    const existingPrefs = current.priceHistoryChartPreferences || {};

    const updatedPrefs: PriceHistoryChartPreferences = {
      ...existingPrefs,
      [productEan]: preferences,
    };

    setAppStorage({ priceHistoryChartPreferences: updatedPrefs });
  } catch (e) {
    console.error("Failed to set price history preferences", e);
  }
}
