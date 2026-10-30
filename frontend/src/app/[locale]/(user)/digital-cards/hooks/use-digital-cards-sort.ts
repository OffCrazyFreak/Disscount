"use client";

import { useSyncExternalStore } from "react";

import {
  DEFAULT_CARD_SORT,
  isCardSortMode,
  type CardSortMode,
} from "@/app/[locale]/(user)/digital-cards/utils/card-sorting";

const STORAGE_KEY = "Disscount_digital_cards_sort";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);

  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): CardSortMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    return isCardSortMode(stored) ? stored : DEFAULT_CARD_SORT;
  } catch {
    return DEFAULT_CARD_SORT;
  }
}

function getServerSnapshot(): CardSortMode {
  return DEFAULT_CARD_SORT;
}

export function useDigitalCardsSort(): [
  CardSortMode,
  (mode: CardSortMode) => void,
] {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function setMode(next: CardSortMode) {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode or a full quota: the choice just lasts until reload.
    }

    listeners.forEach((listener) => listener());
  }

  return [mode, setMode];
}
