import { PeriodOption } from "@/typings/history-period-options";
import { IShoppingListsPreferences } from "@/typings/local-storage";
import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";

function getListPrefs(listId: string): IShoppingListsPreferences {
  return getAppStorage().shoppingListsPreferences?.[listId] ?? {};
}

function setListPrefs(listId: string, partial: IShoppingListsPreferences) {
  const currentPrefs = getAppStorage().shoppingListsPreferences || {};

  setAppStorage({
    shoppingListsPreferences: {
      ...currentPrefs,
      [listId]: { ...(currentPrefs[listId] || {}), ...partial },
    },
  });
}

/** Items section open state; defaults to open. */
export function getShoppingListItemsOpen(listId: string): boolean {
  return getListPrefs(listId).itemsOpen ?? true;
}

export function setShoppingListItemsOpen(listId: string, isOpen: boolean) {
  setListPrefs(listId, { itemsOpen: isOpen });
}

/** Price history section open state; defaults to closed. */
export function getShoppingListPriceHistoryOpen(listId: string): boolean {
  return getListPrefs(listId).priceHistoryOpen ?? false;
}

export function setShoppingListPriceHistoryOpen(
  listId: string,
  isOpen: boolean,
) {
  setListPrefs(listId, { priceHistoryOpen: isOpen });
}

/** Price history chart period; defaults to one week. */
export function getShoppingListPriceHistoryPeriod(
  listId: string,
): PeriodOption {
  return getListPrefs(listId).priceHistoryPeriod ?? "1W";
}

export function setShoppingListPriceHistoryPeriod(
  listId: string,
  period: PeriodOption,
) {
  setListPrefs(listId, { priceHistoryPeriod: period });
}

/** Chains selected in the price history chart. */
export function getShoppingListPriceHistoryChains(
  listId: string,
): string[] | undefined {
  return getListPrefs(listId).priceHistoryChains;
}

export function setShoppingListPriceHistoryChains(
  listId: string,
  chains: string[],
) {
  setListPrefs(listId, { priceHistoryChains: chains });
}

/** Stores section open state; defaults to open. */
export function getShoppingListStoresOpen(listId: string): boolean {
  return getListPrefs(listId).storesOpen ?? true;
}

export function setShoppingListStoresOpen(listId: string, isOpen: boolean) {
  setListPrefs(listId, { storesOpen: isOpen });
}

/**
 * Preferred store-list optimisation mode, shared across all shopping lists.
 * Returns undefined when nothing is stored; the caller validates the value.
 */
export function getStoreOptimizeMode(): string | undefined {
  return getAppStorage().storeOptimizeMode;
}

export function setStoreOptimizeMode(mode: string) {
  setAppStorage({ storeOptimizeMode: mode });
}
