"use client";

import { useSyncExternalStore } from "react";
import { createStorageSubscription } from "@/utils/browser/storage/storage-subscription";

// A UI preference only; card numbers never go to localStorage.
const STORAGE_KEY = "disscount:card-brightness-hint-dismissed";
const { subscribe, notify } = createStorageSubscription();

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Private mode: the hint just comes back next time.
  }
  notify();
}

export function useBrightnessHintDismissed(): [boolean, () => void] {
  // Dismissed on the server so the hint never flashes before the real value is known.
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);

  return [dismissed, dismiss];
}
