"use client";

import { useRouter } from "next/navigation";
import { useSearchSheet } from "@/context/search-sheet-context";
import useRetapScroll from "@/components/custom/bottom-nav/use-retap-scroll";
import type { IBottomNavCellView } from "@/components/custom/bottom-nav/use-bottom-nav-cells";

/** The four things a tap can mean, and the sheet dismissal every one but the centre shares. */
export default function useBottomNavActivation(views: IBottomNavCellView[]) {
  const router = useRouter();
  const { isOpen, toggle, close } = useSearchSheet();
  const { retap, canReturn } = useRetapScroll();

  function activate(index: number) {
    const view = views[index];

    if (view.cell.isCenter) return toggle();

    // Covers what a route-change effect cannot: re-tapping the tab you are on.
    close();

    if (view.isLocked) return;
    if (view.isActive) return retap();

    router.push(view.cell.item.href);
  }

  return { activate, canReturn, isSheetOpen: isOpen };
}
