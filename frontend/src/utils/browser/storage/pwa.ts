import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";

// How long to hide the "install app" banner after a dismissal.
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function isInstallBannerSnoozed(): boolean {
  const dismissedAt = getAppStorage().installBannerDismissedAt;
  return dismissedAt != null && Date.now() - dismissedAt < SNOOZE_MS;
}

export function snoozeInstallBanner() {
  setAppStorage({ installBannerDismissedAt: Date.now() });
}
