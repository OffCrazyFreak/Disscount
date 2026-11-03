"use client";

import { useSyncExternalStore } from "react";
import type { IProductChartPreferences } from "@/typings/local-storage";
import {
  getAppStorage,
  setPriceHistoryPreferences,
} from "@/utils/browser/local-storage";
import { createStorageSubscription } from "@/utils/browser/storage/storage-subscription";

const { subscribe, notify } = createStorageSubscription();

// A string snapshot compares by value, so an unchanged entry never re-renders.
function readEntry(ean: string): string | null {
  const entry = getAppStorage().productsPreferences?.[ean];
  return entry ? JSON.stringify(entry) : null;
}

// The server cannot see localStorage, so it renders the defaults every first visit gets.
function readServerEntry(): string | null {
  return null;
}

/** One product's saved panel preferences; empty on the server and during hydration. */
export function useProductPreferences(ean: string): IProductChartPreferences {
  const entry = useSyncExternalStore(
    subscribe,
    () => readEntry(ean),
    readServerEntry,
  );

  return entry ? (JSON.parse(entry) as IProductChartPreferences) : {};
}

/** Merges into the saved entry, so one panel's write keeps the other panel's state. */
export function updateProductPreferences(
  ean: string,
  changes: IProductChartPreferences,
) {
  const current = getAppStorage().productsPreferences?.[ean] ?? {};
  setPriceHistoryPreferences(ean, { ...current, ...changes });
  notify();
}
