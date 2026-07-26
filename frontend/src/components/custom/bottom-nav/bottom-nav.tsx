"use client";

import { usePathname } from "next/navigation";
import { useNotifications } from "@/context/notifications-context";
import { useCameraScanner } from "@/context/scanner-context";
import useProductNavigation from "@/hooks/use-product-navigation";
import { productEanFromPath } from "@/utils/routes";
import BottomNavCenterItem from "@/components/custom/bottom-nav/bottom-nav-center-item";
import BottomNavItem from "@/components/custom/bottom-nav/bottom-nav-item";
import resolveHoldTarget from "@/components/custom/bottom-nav/resolve-hold-target";
import useActiveListProgress from "@/components/custom/bottom-nav/use-active-list-progress";
import useBottomNavActivation from "@/components/custom/bottom-nav/use-bottom-nav-activation";
import useBottomNavCells from "@/components/custom/bottom-nav/use-bottom-nav-cells";
import useBottomNavPointer from "@/components/custom/bottom-nav/use-bottom-nav-pointer";
import useIndicatorOpacity from "@/components/custom/bottom-nav/use-indicator-opacity";
import { BOTTOM_NAV_SEARCH_INDEX } from "@/components/custom/bottom-nav/bottom-nav-items";

/**
 * The scrolled header's pill treatment, so the two floating bars match.
 *
 * The inset and inner padding are explicit rem values, not spacing utilities,
 * because this project's --spacing is 0.2rem. Together they keep the 57.6px
 * active disc clear of the pill's edges on the first and last cell. The surface
 * colour itself lives in globals.css, since it is what the scroll animates.
 */
const SURFACE_CLASS =
  "flex items-stretch h-[var(--bottom-nav-h)] touch-none mx-[0.5rem] px-[0.4rem] mb-[max(var(--bottom-nav-gap),var(--bottom-nav-safe))] rounded-full border backdrop-blur-sm";

/**
 * The mobile primary navigation. Hidden from `md` up through CSS rather than a
 * media-query hook, so the markup ships in the prerendered HTML and the page
 * never shifts on hydration.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const { notifications, hasNotifications } = useNotifications();
  const { openScanner } = useCameraScanner();
  const navigateToProduct = useProductNavigation();
  const listProgress = useActiveListProgress();
  const cells = useBottomNavCells();
  const { activate, canReturn, isSearchOpen } = useBottomNavActivation(cells);

  const productPageEan = productEanFromPath(pathname);

  function holdFor(index: number) {
    return resolveHoldTarget(cells[index].entry, {
      productEan: productPageEan,
      isLocked: cells[index].isLocked,
      openScanner: () =>
        openScanner({ onScan: (code) => navigateToProduct(code.rawValue) }),
    });
  }

  const { scrubIndex, listProps } = useBottomNavPointer({
    onActivate: activate,
    holdFor,
  });

  // The disc previews the thumb's cell mid-scrub, then settles back on the
  // route's, so the gesture says which cell a release would commit.
  const scrubbedDisc =
    scrubIndex !== null && !cells[scrubIndex].isLocked ? scrubIndex : null;
  const discIndex =
    scrubbedDisc ?? cells.findIndex((cell) => cell.isActive && !cell.isLocked);

  const indicatorOpacity = useIndicatorOpacity(
    discIndex === BOTTOM_NAV_SEARCH_INDEX,
  );

  return (
    <nav
      aria-label="Glavna navigacija"
      // The products sheet is non-modal, and globals.css hands the whole page back
      // for those, so the bar needs no opt-in of its own. It stays inert under
      // real modals, whose overlay covers it anyway.
      className="bottom-nav-compacts fixed inset-x-0 bottom-0 z-[var(--z-bottom-nav)] md:hidden"
    >
      {/* touch-none keeps a horizontal scrub from being read as a page pan.
          role="list" because Tailwind's list-style: none drops list semantics
          in Safari, which otherwise announces five loose buttons. */}
      <ul role="list" className={SURFACE_CLASS} {...listProps}>
        {cells.map(({ entry, isActive, isLocked }, index) =>
          entry.isSearch ? (
            <BottomNavCenterItem
              key={entry.item.id}
              label={entry.item.shortLabel ?? entry.item.label}
              isActive={isActive}
              isScrubbed={scrubIndex === index}
              showsDisc={discIndex === index}
              isSearchOpen={isSearchOpen}
              indicatorOpacity={indicatorOpacity}
              onKeyboardActivate={() => activate(index)}
            />
          ) : (
            <BottomNavItem
              key={entry.item.id}
              entry={entry}
              isActive={isActive}
              isScrubbed={scrubIndex === index}
              isLocked={isLocked}
              showsDisc={discIndex === index}
              hasHold={holdFor(index) !== null}
              indicatorOpacity={indicatorOpacity}
              // TODO: swap for a count of watched products whose price dropped
              // since the last visit, cleared on visit and capped at 9+.
              badgeCount={
                entry.item.badge && hasNotifications
                  ? notifications.length
                  : undefined
              }
              listProgress={
                entry.item.id === "shopping-lists" ? listProgress : undefined
              }
              canReturn={canReturn}
              onKeyboardActivate={() => activate(index)}
            />
          ),
        )}
      </ul>
    </nav>
  );
}
