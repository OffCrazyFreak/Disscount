import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";

export function getStoredBottomNavVariant(): string | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    return getAppStorage().bottomNavVariant;
  } catch {
    return undefined;
  }
}

export function setStoredBottomNavVariant(variant: string) {
  if (typeof window === "undefined") return;

  try {
    setAppStorage({ bottomNavVariant: variant });
  } catch (e) {
    console.error("Failed to set bottom nav variant", e);
  }
}
