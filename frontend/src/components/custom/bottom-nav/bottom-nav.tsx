"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useCameraScanner } from "@/context/scanner-context";
import useProductNavigation from "@/hooks/use-product-navigation";
import { useWatchlistPriceDropCount } from "@/lib/watchlist/use-watchlist-price-drop-count";
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

/** Explicit rem values, not spacing utilities, because this project's --spacing is 0.2rem; the surface colour lives in globals.css since the scroll animates it. */
const SURFACE_CLASS =
  "flex items-stretch justify-between h-[var(--bottom-nav-h)] touch-none mx-[0.5rem] px-[0.4rem] mb-[max(var(--bottom-nav-gap),var(--bottom-nav-safe))] rounded-full border backdrop-blur-xs";

/** Hidden from `md` up through CSS rather than a media-query hook, so the markup prerenders and the page never shifts on hydration. */
export default function BottomNav() {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const { count: priceDropCount } = useWatchlistPriceDropCount();
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

  const { scrubIndex, previewIndex, listProps } = useBottomNavPointer({
    onActivate: activate,
    holdFor,
    routeKey: pathname,
  });

  // A navigation keeps its destination preview until the pathname catches up, so the disc never returns briefly to the previous route.
  const previewedDisc =
    previewIndex !== null && !cells[previewIndex].isLocked
      ? previewIndex
      : null;
  const discIndex =
    previewedDisc ?? cells.findIndex((cell) => cell.isActive && !cell.isLocked);

  const indicatorOpacity = useIndicatorOpacity(
    discIndex === BOTTOM_NAV_SEARCH_INDEX,
  );

  return (
    <nav
      aria-label={t("bottomNav.label")}
      // The products sheet is non-modal and globals.css hands the page back for those; the bar stays inert under real modals, whose overlay covers it.
      className="bottom-nav-compacts fixed inset-x-0 bottom-0 z-[var(--z-bottom-nav)] md:hidden"
    >
      {/* touch-none keeps a horizontal scrub from reading as a page pan; role="list" because list-style: none drops list semantics in Safari. */}
      <ul role="list" className={SURFACE_CLASS} {...listProps}>
        {cells.map(({ entry, isActive, isLocked }, index) =>
          entry.isSearch ? (
            <BottomNavCenterItem
              key={entry.item.id}
              label={t(entry.item.shortLabelKey ?? entry.item.labelKey)}
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
              badgeCount={
                entry.item.badge && priceDropCount > 0
                  ? priceDropCount
                  : undefined
              }
              badgeLabel={t("nav.watchlistPriceDrops", {
                label: t(entry.item.shortLabelKey ?? entry.item.labelKey),
                count: priceDropCount,
              })}
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
