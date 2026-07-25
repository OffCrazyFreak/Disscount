"use client";

import { usePathname } from "next/navigation";
import { useCameraScanner } from "@/context/scanner-context";
import useProductNavigation from "@/hooks/use-product-navigation";
import { productEanFromPath } from "@/utils/route-ids";
import BottomNavActiveDisc from "@/components/custom/bottom-nav/bottom-nav-active-disc";
import BottomNavCell from "@/components/custom/bottom-nav/bottom-nav-cell";
import BottomNavCenterCell from "@/components/custom/bottom-nav/bottom-nav-center-cell";
import { CENTER_INDEX } from "@/components/custom/bottom-nav/bottom-nav-items";
import resolveHoldTarget from "@/components/custom/bottom-nav/resolve-hold-target";
import useBottomNavActivation from "@/components/custom/bottom-nav/use-bottom-nav-activation";
import useBottomNavCells from "@/components/custom/bottom-nav/use-bottom-nav-cells";
import useBottomNavPointer from "@/components/custom/bottom-nav/use-bottom-nav-pointer";
import useCellRects from "@/components/custom/bottom-nav/use-cell-rects";
import useShoppingListProgress from "@/components/custom/bottom-nav/use-shopping-list-progress";

/**
 * The scrolled header's pill treatment, so the two floating bars match. Its
 * inset and inner padding are explicit lengths, which together hold the active
 * disc clear of the pill's border on the first and last cell.
 */
const PILL_CLASS =
  "mx-[0.5rem] mb-[max(var(--bottom-nav-gap),var(--bottom-nav-safe))] flex h-[var(--bottom-nav-h)] touch-none items-stretch rounded-full border bg-background/50 px-[0.4rem] backdrop-blur-sm";

const LISTS_CELL_ID = "shopping-lists";

/**
 * Hidden from md up in CSS rather than by a breakpoint hook, so the markup ships
 * in the prerendered HTML and the page never shifts on hydration.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const views = useBottomNavCells();
  const completion = useShoppingListProgress();
  const { openScanner } = useCameraScanner();
  const navigateToProduct = useProductNavigation();
  const { activate, canReturn, isSheetOpen } = useBottomNavActivation(views);
  const { registerCell, indexFromClientX, cellAt } = useCellRects();

  const productEan = productEanFromPath(pathname);

  function holdFor(index: number) {
    const view = views[index];
    if (view.isLocked) return null;

    return resolveHoldTarget(view.cell, {
      productEan,
      openScanner: () =>
        openScanner({ onScan: (code) => navigateToProduct(code.rawValue) }),
    });
  }

  const { scrubIndex, barProps } = useBottomNavPointer({
    indexFromClientX,
    cellAt,
    onActivate: activate,
    holdFor,
  });

  const activeIndex = views.findIndex((view) => view.isActive);
  const discIndex = scrubIndex ?? activeIndex;

  return (
    <nav
      aria-label="Glavna navigacija"
      className="bottom-nav-compacts fixed inset-x-0 bottom-0 z-[var(--z-bottom-nav)] md:hidden"
    >
      <div
        className={PILL_CLASS}
        style={{ opacity: "var(--nav-surface-opacity)" }}
        {...barProps}
      >
        <ul className="relative flex flex-1 items-stretch">
          <BottomNavActiveDisc
            index={discIndex < 0 ? CENTER_INDEX : discIndex}
            count={views.length}
            opacity={discIndex >= 0 && discIndex !== CENTER_INDEX ? 1 : 0}
          />

          {views.map((view, index) =>
            view.cell.isCenter ? (
              <BottomNavCenterCell
                key={view.cell.item.id}
                view={view}
                isScrubbed={scrubIndex === index}
                isSheetOpen={isSheetOpen}
                registerRef={registerCell(index)}
                onActivate={() => activate(index)}
              />
            ) : (
              <BottomNavCell
                key={view.cell.item.id}
                view={view}
                isScrubbed={scrubIndex === index && !view.isLocked}
                completion={
                  view.cell.item.id === LISTS_CELL_ID ? completion : null
                }
                canReturn={canReturn}
                registerRef={registerCell(index)}
                onActivate={() => activate(index)}
              />
            ),
          )}
        </ul>
      </div>
    </nav>
  );
}
