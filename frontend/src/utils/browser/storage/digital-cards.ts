import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";

/**
 * Preferred card sort, shared across the whole wallet.
 * Returns undefined when nothing is stored; the caller validates the value.
 */
export function getDigitalCardSort(): string | undefined {
  return getAppStorage().digitalCardSort;
}

export function setDigitalCardSort(mode: string) {
  setAppStorage({ digitalCardSort: mode });
}
