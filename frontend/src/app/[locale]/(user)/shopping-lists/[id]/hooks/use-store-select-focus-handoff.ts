import { useLayoutEffect, type RefObject } from "react";

import type { ItemPriceState } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/item-price-state";
import {
  focusItemName,
  focusStoreSelect,
} from "@/app/[locale]/(user)/shopping-lists/[id]/utils/store-select-focus";

/** Swapping in the live select unmounts the focused trigger, so the list-wide ref outlives the row and lets the live select take focus back. */
export function useStoreSelectFocusHandoff(
  itemId: string,
  priceState: ItemPriceState,
  lostFocusItemIdRef: RefObject<string | null>,
) {
  useLayoutEffect(() => {
    if (priceState !== "ready" || lostFocusItemIdRef.current !== itemId) {
      return;
    }

    lostFocusItemIdRef.current = null;
    // A link viewer's live select is disabled, so the item's own name is the nearest stop.
    if (!focusStoreSelect([itemId])) focusItemName(itemId);
  }, [priceState, itemId, lostFocusItemIdRef]);

  return function rememberFocusOnUnmount(trigger: HTMLButtonElement) {
    // A ref also detaches and reattaches when its callback changes; that was no unmount.
    if (lostFocusItemIdRef.current === itemId)
      lostFocusItemIdRef.current = null;

    return () => {
      if (document.activeElement === trigger) {
        lostFocusItemIdRef.current = itemId;
      }
    };
  };
}
