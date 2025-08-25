// Simple wrapper around a single localStorage key to store app-wide data
// Keeps all data under the "Disccount_app" key and exposes helpers
// to read/merge specific fields (so we don't overwrite unrelated settings).
const APP_KEY = "Disccount_app";

type AppData = Record<string, any>;

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
  if (!current || !Object.prototype.hasOwnProperty.call(current, "accessToken")) return;
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

export default {
  getAppStorage,
  setAppStorage,
  getAccessToken,
  setAccessToken,
  removeAccessToken,
};
