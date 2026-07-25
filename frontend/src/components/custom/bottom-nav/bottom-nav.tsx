"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavCell from "@/components/custom/bottom-nav/bottom-nav-cell";
import BottomNavIndicator from "@/components/custom/bottom-nav/bottom-nav-indicator";
import { BOTTOM_NAV_CELLS } from "@/components/custom/bottom-nav/bottom-nav-cells";
import useBottomNavState from "@/components/custom/bottom-nav/use-bottom-nav-state";
import useBarPointer from "@/components/custom/bottom-nav/use-bar-pointer";
import useReturnScroll from "@/components/custom/bottom-nav/use-return-scroll";
import useHoldActions from "@/components/custom/bottom-nav/use-hold-actions";
import resolveHoldTarget from "@/components/custom/bottom-nav/resolve-hold-target";
import { useSearchSheet } from "@/context/search-sheet-context";

// touch-none belongs to the pill alone: it is fixed chrome, so a horizontal
// scrub is never a page pan. Nothing inside a scroller may suppress panning.
const PILL_CLASS =
  "relative flex h-[var(--bottom-nav-h)] touch-none list-none items-stretch rounded-[var(--bottom-nav-radius)] border p-[var(--bottom-nav-pill-padding)] backdrop-blur-sm";

/**
 * Hidden by CSS rather than a breakpoint hook, so the markup ships in the
 * prerendered HTML and nothing shifts on hydration. Mounted last in the layout,
 * so keyboard users reach the page's content first.
 */
export default function BottomNav() {
  const router = useRouter();
  const returnScroll = useReturnScroll();
  const runHold = useHoldActions();
  const searchSheet = useSearchSheet();
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const {
    activeIndex,
    discIndex,
    discVisible,
    isLocked,
    notificationCount,
    productEan,
    shoppingListId,
  } = useBottomNavState();

  function holdTarget(index: number) {
    return resolveHoldTarget(BOTTOM_NAV_CELLS[index], {
      productEan,
      isLocked: isLocked(index),
    });
  }

  function activate(index: number) {
    const cell = BOTTOM_NAV_CELLS[index];

    if (cell.togglesSearchSheet) {
      searchSheet.toggleSheet();
      return;
    }

    // Every other branch dismisses first, which covers what a route-change rule
    // cannot: re-tapping the current tab never changes the pathname.
    searchSheet.closeSheet();

    if (isLocked(index)) return;

    if (index === activeIndex) {
      returnScroll.toggleScroll();
      return;
    }

    router.push(cell.item.href);
  }

  const pointerHandlers = useBarPointer({
    onActivate: activate,
    onScrub: setScrubIndex,
    // One resolver answers both, so they can never disagree.
    hasHold: (index) => holdTarget(index) !== null,
    onHold: (index) => {
      const target = holdTarget(index);
      if (target) runHold(target, productEan);
    },
  });

  return (
    <nav
      aria-label="Glavna navigacija"
      data-bottom-nav
      className="bottom-nav-compacts fixed inset-x-0 bottom-[calc(var(--bottom-nav-gap)+var(--bottom-nav-safe))] z-[var(--z-bottom-nav)] px-[var(--bottom-nav-gap)] md:hidden"
    >
      <ul className={PILL_CLASS} {...pointerHandlers}>
        <BottomNavIndicator index={discIndex} visible={discVisible} />

        {BOTTOM_NAV_CELLS.map((cell, index) => (
          <li key={cell.item.id} className="flex min-w-0 flex-1">
            <BottomNavCell
              cell={cell}
              index={index}
              isActive={index === activeIndex}
              isLocked={isLocked(index)}
              isScrubbed={index === scrubIndex}
              isSheetOpen={searchSheet.isOpen}
              notificationCount={notificationCount}
              shoppingListId={shoppingListId}
              hasReturnPosition={returnScroll.hasReturnPosition}
              onActivate={activate}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
