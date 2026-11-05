import { ViewMode } from "@/typings/view-mode";
import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";

export function getViewMode(path: string, defaultMode: ViewMode = "grid") {
  if (typeof window === "undefined") return defaultMode;

  try {
    return (getAppStorage().viewModes?.[path] as ViewMode) ?? defaultMode;
  } catch {
    return defaultMode;
  }
}

export function setViewMode(path: string, mode: ViewMode) {
  if (typeof window === "undefined") return;

  try {
    const viewModes = { ...(getAppStorage().viewModes || {}), [path]: mode };
    setAppStorage({ viewModes });
  } catch (e) {
    console.error("Failed to set view mode", e);
  }
}
