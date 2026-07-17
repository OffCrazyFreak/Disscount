// Single-key localStorage wrapper: all app data lives under "Disscount_app"
// and domain helpers read/merge specific fields so unrelated settings survive.
import { AppData } from "@/typings/local-storage";

const APP_KEY = "Disscount_app";

export function getAppStorage(): AppData {
  if (typeof window === "undefined") return {};

  const raw = localStorage.getItem(APP_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as AppData;
  } catch (e) {
    console.warn("Failed to parse app storage, resetting", e);
    try {
      localStorage.removeItem(APP_KEY);
    } catch {}
    return {};
  }
}

export function setAppStorage(partial: AppData) {
  if (typeof window === "undefined") return;

  const merged = { ...getAppStorage(), ...partial };

  try {
    localStorage.setItem(APP_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error("Failed to write app storage", e);
  }
}
