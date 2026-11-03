/** Marks the box around an item's store select, so focus can be handed to it from elsewhere. */
export const STORE_SELECT_ITEM_ATTRIBUTE = "data-store-select-item";

/** Focuses the store select of the first of these items in page order, if one can take focus. */
export function focusStoreSelect(itemIds: readonly string[]) {
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
      return;
    }
  }
}
