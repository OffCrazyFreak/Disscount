"use client";

import { usePathname, useRouter } from "next/navigation";
import { useNotifications } from "@/context/notifications-context";
import { useCameraScanner } from "@/context/scanner-context";
import { useSearchSheet } from "@/context/search-sheet-context";
import { useUser } from "@/context/user-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import useProductNavigation from "@/hooks/use-product-navigation";
import useTabReentry from "@/hooks/use-tab-reentry";
import BottomNavCenterItem from "@/components/custom/bottom-nav/bottom-nav-center-item";
import BottomNavItem from "@/components/custom/bottom-nav/bottom-nav-item";
import useActiveListProgress from "@/components/custom/bottom-nav/use-active-list-progress";
import useBottomNavPointer from "@/components/custom/bottom-nav/use-bottom-nav-pointer";
import useIndicatorOpacity from "@/components/custom/bottom-nav/use-indicator-opacity";
import useProductPageEan from "@/components/custom/bottom-nav/use-product-page-ean";
import {
  bottomNavItems,
  BOTTOM_NAV_SEARCH_INDEX,
  type IBottomNavItem,
} from "@/components/custom/bottom-nav/bottom-nav-items";
import type { ModalTarget } from "@/lib/modal/modal-registry";

/**
 * The scrolled header's pill treatment, so the two floating bars match.
 *
 * The inset and inner padding are explicit rem values, not spacing utilities,
 * because this project's --spacing is 0.2rem. Together they keep the 57.6px
 * active disc clear of the pill's edges on the first and last cell.
 */
const SURFACE_CLASS =
  "flex items-stretch h-[var(--bottom-nav-h)] touch-none mx-[0.5rem] px-[0.4rem] mb-[max(var(--bottom-nav-gap),var(--bottom-nav-safe))] rounded-full border bg-background/50 backdrop-blur-sm";

/**
 * The mobile primary navigation. Hidden from `md` up through CSS rather than a
 * media-query hook, so the markup ships in the prerendered HTML and the page
 * never shifts on hydration.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { notifications, hasNotifications } = useNotifications();
  const { openScanner } = useCameraScanner();
  const {
    isOpen: isSearchOpen,
    open: openSearch,
    close: closeSearch,
  } = useSearchSheet();
  const { reenter, canReturn } = useTabReentry();
  const { user } = useUser();
  const navigateToProduct = useProductNavigation();
  const listProgress = useActiveListProgress();
  const productPageEan = useProductPageEan();

  const userIsAdmin = isAdmin(user?.accountType);

  // Route match, which drives styling for every cell including the search one.
  // Activation is a separate question, answered by `isSearch` below.
  function isActiveIndex(index: number) {
    return pathname.startsWith(bottomNavItems[index].item.href);
  }

  // Coming-soon tabs are dead ends for everyone but admins, as in the sidebar.
  function isLockedIndex(index: number) {
    return Boolean(bottomNavItems[index].item.comingSoon) && !userIsAdmin;
  }

  const indicatorOpacity = useIndicatorOpacity(
    isActiveIndex(BOTTOM_NAV_SEARCH_INDEX),
  );

  function activate(index: number) {
    const entry = bottomNavItems[index];

    // The sheet is non-modal, which vaul takes to mean no press outside it may
    // dismiss it, so the bar is the only thing that can close it again.
    if (entry.isSearch) return isSearchOpen ? closeSearch() : openSearch();

    // Every other cell dismisses it too, which covers what the sheet's own
    // pathname effect cannot: re-tapping the tab you are already on.
    closeSearch();

    if (isLockedIndex(index)) return;

    // Re-entering the tab you are on scrolls to the top, then back again.
    if (isActiveIndex(index)) return reenter();

    router.push(entry.item.href);
  }

  // On a product's page the cells act on that product instead: Praćenje watches
  // it, Popisi adds it to a list. Elsewhere they fall back to their own target,
  // which for Praćenje is nothing at all.
  function longPressTarget(entry: IBottomNavItem): ModalTarget | null {
    if (productPageEan && entry.productPageTarget)
      return entry.productPageTarget(productPageEan);

    return entry.longPressEnabled ? (entry.longPressTarget ?? null) : null;
  }

  function longPress(index: number) {
    const entry = bottomNavItems[index];

    if (entry.isSearch) {
      openScanner({ onScan: (code) => navigateToProduct(code.rawValue) });
      return;
    }

    const target = longPressTarget(entry);
    if (target) openModalUrl(target);
  }

  function canLongPress(index: number) {
    const entry = bottomNavItems[index];

    if (isLockedIndex(index)) return false;

    return Boolean(entry.isSearch || longPressTarget(entry));
  }

  const { scrubIndex, listProps } = useBottomNavPointer({
    onActivate: activate,
    onLongPress: longPress,
    canLongPress,
  });

  return (
    <nav
      aria-label="Glavna navigacija"
      // The search sheet is non-modal, and globals.css hands the whole page back
      // for those, so the bar needs no opt-in of its own. It stays inert under
      // real modals, whose overlay covers it anyway.
      className="bottom-nav-compacts fixed inset-x-0 bottom-0 z-[45] md:hidden"
    >
      {/* touch-none keeps a horizontal scrub from being read as a page pan */}
      <ul
        className={SURFACE_CLASS}
        style={{ opacity: "var(--bottom-nav-surface-opacity)" }}
        {...listProps}
      >
        {bottomNavItems.map((entry, index) =>
          entry.isSearch ? (
            <BottomNavCenterItem
              key={entry.item.id}
              label={entry.item.shortLabel ?? entry.item.label}
              isActive={isActiveIndex(index)}
              isScrubbed={scrubIndex === index}
              isSearchOpen={isSearchOpen}
              indicatorOpacity={indicatorOpacity}
              onKeyboardActivate={() => activate(index)}
            />
          ) : (
            <BottomNavItem
              key={entry.item.id}
              entry={entry}
              isActive={isActiveIndex(index)}
              isScrubbed={scrubIndex === index}
              isLocked={isLockedIndex(index)}
              indicatorOpacity={indicatorOpacity}
              // TODO: swap for a count of watched products whose price dropped
              // since the last visit, cleared on visit and capped at 9+.
              badgeCount={hasNotifications ? notifications.length : undefined}
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
