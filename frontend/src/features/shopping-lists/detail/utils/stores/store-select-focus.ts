export const STORE_SELECT_ITEM_ATTRIBUTE = "data-store-select-item";

export const ITEM_NAME_ATTRIBUTE = "data-item-name";

export function focusStoreSelect(itemIds: readonly string[]): boolean {
  const slots = document.querySelectorAll(`[${STORE_SELECT_ITEM_ATTRIBUTE}]`);

  for (const slot of slots) {
    if (!itemIds.includes(slot.getAttribute(STORE_SELECT_ITEM_ATTRIBUTE)!)) {
      continue;
    }

    const select = slot.querySelector<HTMLElement>(
      '[role="combobox"]:not(:disabled)',
    );
    if (select) {
      select.focus();
      return true;
    }
  }

  return false;
}

export function focusItemName(itemId: string) {
  for (const name of document.querySelectorAll(`[${ITEM_NAME_ATTRIBUTE}]`)) {
    if (name.getAttribute(ITEM_NAME_ATTRIBUTE) === itemId) {
      name.querySelector<HTMLElement>("a")?.focus();
      return;
    }
  }
}
