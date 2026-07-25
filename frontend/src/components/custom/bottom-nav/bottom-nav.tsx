"use client";

import { useEffect, useState } from "react";
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
import {
  DEFAULT_BOTTOM_NAV_VARIANT,
  readBottomNavVariant,
  type TBottomNavVariant,
} from "@/components/custom/bottom-nav/bottom-nav-variant";

// One markup tree for all three surfaces, switched on a data attribute.
const SURFACE_CLASS =
  "flex items-stretch data-[variant=pill]:mx-3 data-[variant=pill]:mb-[max(var(--bottom-nav-gap),var(--bottom-nav-safe))] data-[variant=pill]:rounded-full data-[variant=pill]:border data-[variant=pill]:bg-background/95 data-[variant=pill]:shadow-lg data-[variant=flat]:border-t data-[variant=flat]:bg-background data-[variant=flat]:pb-[var(--bottom-nav-safe)] data-[variant=glass]:border-t data-[variant=glass]:bg-background/70 data-[variant=glass]:pb-[var(--bottom-nav-safe)] data-[variant=glass]:backdrop-blur-lg";

/**
 * The mobile primary navigation. Hidden from `md` up through CSS rather than a
 * media-query hook, so the markup ships in the prerendered HTML and the page
 * never shifts on hydration.
 */
export default function BottomNav() {
  const [variant, setVariant] = useState<TBottomNavVariant>(
    DEFAULT_BOTTOM_NAV_VARIANT,
  );

  const pathname = usePathname();
  const router = useRouter();
  const { notifications, hasNotifications } = useNotifications();
  const { openScanner } = useCameraScanner();
  const { isOpen: isSearchOpen, open: openSearch } = useSearchSheet();
  const { reenter, canReturn } = useTabReentry();
  const navigateToProduct = useProductNavigation();
  const listProgress = useActiveListProgress();

  useEffect(() => setVariant(readBottomNavVariant()), []);

  function isActiveIndex(index: number) {
    const entry = bottomNavItems[index];

    return !entry.isSearch && pathname.startsWith(entry.item.href);
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
    count: bottomNavItems.length,
    onActivate: activate,
    onLongPress: longPress,
    canLongPress,
  });

  return (
    <nav
      aria-label="Glavna navigacija"
      className="bottom-nav-compacts fixed inset-x-0 bottom-0 z-[45] md:hidden"
    >
      <ul
        data-variant={variant}
        // touch-none keeps a horizontal scrub from being read as a page pan.
        className={cn(SURFACE_CLASS, "h-[var(--bottom-nav-h)] touch-none")}
        style={{ opacity: "var(--bottom-nav-surface-opacity)" }}
        {...listProps}
      >
        {bottomNavItems.map((entry, index) =>
          entry.isSearch ? (
            <BottomNavCenterItem
              key={entry.item.id}
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
