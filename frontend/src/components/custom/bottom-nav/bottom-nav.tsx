"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/context/notifications-context";
import { useCameraScanner } from "@/context/scanner-context";
import { useSearchSheet } from "@/context/search-sheet-context";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import useProductNavigation from "@/hooks/use-product-navigation";
import useTabReentry from "@/hooks/use-tab-reentry";
import BottomNavCenterItem from "@/components/custom/bottom-nav/bottom-nav-center-item";
import BottomNavItem from "@/components/custom/bottom-nav/bottom-nav-item";
import useActiveListProgress from "@/components/custom/bottom-nav/use-active-list-progress";
import useBottomNavPointer from "@/components/custom/bottom-nav/use-bottom-nav-pointer";
import { bottomNavItems } from "@/components/custom/bottom-nav/bottom-nav-items";

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
  const { isOpen: isSearchOpen, open: openSearch } = useSearchSheet();
  const { reenter, canReturn } = useTabReentry();
  const navigateToProduct = useProductNavigation();
  const listProgress = useActiveListProgress();

  // Route match, which drives styling for every cell including the search one.
  // Activation is a separate question, answered by `isSearch` below.
  function isActiveIndex(index: number) {
    return pathname.startsWith(bottomNavItems[index].item.href);
  }

  function activate(index: number) {
    const entry = bottomNavItems[index];

    if (entry.isSearch) return openSearch();

    // Re-entering the tab you are on scrolls to the top, then back again.
    if (isActiveIndex(index)) return reenter();

    router.push(entry.item.href);
  }

  function longPress(index: number) {
    const entry = bottomNavItems[index];

    if (entry.isSearch) {
      openScanner({ onScan: (code) => navigateToProduct(code.rawValue) });
      return;
    }

    if (entry.longPressTarget) openModalUrl(entry.longPressTarget);
  }

  function canLongPress(index: number) {
    const entry = bottomNavItems[index];

    return Boolean(
      entry.isSearch || (entry.longPressTarget && entry.longPressEnabled),
    );
  }

  const { scrubIndex, listProps } = useBottomNavPointer({
    onActivate: activate,
    onLongPress: longPress,
    canLongPress,
  });

  return (
    <nav
      aria-label="Glavna navigacija"
      className={cn(
        "bottom-nav-compacts fixed inset-x-0 bottom-0 z-[45] md:hidden",
        // An open dismissable layer disables pointer events on the body. The
        // search sheet is deliberately non-modal, so the bar opts back in for
        // that one case, while staying inert under real modals.
        isSearchOpen && "pointer-events-auto",
      )}
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
              onKeyboardActivate={() => activate(index)}
            />
          ) : (
            <BottomNavItem
              key={entry.item.id}
              entry={entry}
              isActive={isActiveIndex(index)}
              isScrubbed={scrubIndex === index}
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
