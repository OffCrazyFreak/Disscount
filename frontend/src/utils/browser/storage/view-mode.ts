import { ViewMode } from "@/typings/view-mode";
import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";

/**
 * Get stored view mode for a specific path, falling back to the default.
 */
export function getViewMode(path: string, defaultMode: ViewMode = "grid") {
  if (typeof window === "undefined") return defaultMode;

  try {
    return (getAppStorage().viewModes?.[path] as ViewMode) ?? defaultMode;
  } catch {
    return defaultMode;
  }
}

/**
 * Set view mode for a specific path.
 */
export function setViewMode(path: string, mode: ViewMode) {
  if (typeof window === "undefined") return;

  try {
    const viewModes = { ...(getAppStorage().viewModes || {}), [path]: mode };
    setAppStorage({ viewModes });
  } catch (e) {
    console.error("Failed to set view mode", e);
  }
}
