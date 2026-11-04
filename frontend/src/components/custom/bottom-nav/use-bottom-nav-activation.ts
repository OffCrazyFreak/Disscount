"use client";

import { useRouter } from "@/i18n/navigation";
import { useProductsSheet } from "@/context/products-sheet-context";
import useTabReentry from "@/hooks/use-tab-reentry";
import type { IBottomNavCell } from "@/components/custom/bottom-nav/use-bottom-nav-cells";

/** Whether a cell navigates or toggles the sheet is a property of the cell, never derived from the route it matches. */
export default function useBottomNavActivation(cells: IBottomNavCell[]) {
  const router = useRouter();
  const { isOpen, open, close } = useProductsSheet();
  const { reenter, canReturn } = useTabReentry();

  function activate(index: number): boolean {
    const { entry, isActive, isLocked } = cells[index];

    // The sheet is non-modal and ignores presses outside it, so the bar is the only thing that can close it.
    if (entry.isSearch) {
      if (isOpen) close();
      else open();

      return false;
    }

    // Every other cell dismisses it too, covering what the sheet's pathname effect cannot: re-tapping the tab you are on.
    close();

    if (isLocked) return false;

    // Re-entering the tab you are on scrolls to the top, then back again.
    if (isActive) {
      reenter();

      return false;
    }

    router.push(entry.item.href);

    return true;
  }

  return { activate, canReturn, isSearchOpen: isOpen };
}
