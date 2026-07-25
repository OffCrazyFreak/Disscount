"use client";

import { useRouter } from "next/navigation";
import { useSearchSheet } from "@/context/search-sheet-context";
import useTabReentry from "@/hooks/use-tab-reentry";
import type { IBottomNavCell } from "@/components/custom/bottom-nav/use-bottom-nav-cells";

/**
 * What a press commits to. Whether a cell navigates or toggles the sheet is a
 * property of the cell, never derived from the route it happens to match.
 */
export default function useBottomNavActivation(cells: IBottomNavCell[]) {
  const router = useRouter();
  const { isOpen, open, close } = useSearchSheet();
  const { reenter, canReturn } = useTabReentry();

  function activate(index: number) {
    const { entry, isActive, isLocked } = cells[index];

    // The sheet is non-modal, which vaul takes to mean no press outside it may
    // dismiss it, so the bar is the only thing that can close it again.
    if (entry.isSearch) return isOpen ? close() : open();

    // Every other cell dismisses it too, which covers what the sheet's own
    // pathname effect cannot: re-tapping the tab you are already on.
    close();

    if (isLocked) return;

    // Re-entering the tab you are on scrolls to the top, then back again.
    if (isActive) return reenter();

    router.push(entry.item.href);
  }

  return { activate, canReturn, isSearchOpen: isOpen };
}
