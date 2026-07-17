import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";

/**
 * Whether the user dismissed the "install app" banner (so we don't show it again).
 */
export function getInstallBannerDismissed(): boolean {
  return getAppStorage().installBannerDismissed ?? false;
}

/**
 * Persist that the user dismissed the "install app" banner.
 */
export function setInstallBannerDismissed(dismissed: boolean) {
  setAppStorage({ installBannerDismissed: dismissed });
}
