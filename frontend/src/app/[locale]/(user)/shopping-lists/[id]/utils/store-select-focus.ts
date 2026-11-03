/** Marks the box around an item's store select, so focus can be handed to it from elsewhere. */
export const STORE_SELECT_ITEM_ATTRIBUTE = "data-store-select-item";

/** Marks an item's name, the fallback when its store select cannot take focus. */
export const ITEM_NAME_ATTRIBUTE = "data-item-name";

/** Focuses the store select of the first of these items in page order, if one can take focus. */
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

/** Focuses the item's name link, for when its live store select is disabled. */
export function focusItemName(itemId: string) {
  for (const name of document.querySelectorAll(`[${ITEM_NAME_ATTRIBUTE}]`)) {
    if (name.getAttribute(ITEM_NAME_ATTRIBUTE) === itemId) {
      name.querySelector<HTMLElement>("a")?.focus();
      return;
    }
  }
}
