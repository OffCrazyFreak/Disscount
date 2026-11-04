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

/** Items grouped by store instead of A to Z; defaults to A to Z. */
export function getShoppingListGroupByStore(listId: string): boolean {
  return getListPrefs(listId).groupByStore ?? false;
}

export function setShoppingListGroupByStore(listId: string, grouped: boolean) {
  setListPrefs(listId, { groupByStore: grouped });
}

/** The caller validates the value. */
export function getStoreOptimizeMode(): string | undefined {
  return getAppStorage().storeOptimizeMode;
}

export function setStoreOptimizeMode(mode: string) {
  setAppStorage({ storeOptimizeMode: mode });
}
