"use client";

import { cn } from "@/lib/utils";
import { isKeyboardClick } from "@/utils/events";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import BottomNavIndicator from "@/components/custom/bottom-nav/bottom-nav-indicator";
import BottomNavItemGlyph from "@/components/custom/bottom-nav/bottom-nav-item-glyph";
import BottomNavRing from "@/components/custom/bottom-nav/bottom-nav-ring";
import {
  CELL_BUTTON_CLASS,
  CELL_ITEM_CLASS,
  CELL_LABEL_CLASS,
} from "@/components/custom/bottom-nav/bottom-nav-classes";
import type { IBottomNavItem } from "@/components/custom/bottom-nav/bottom-nav-items";
import type { IndicatorOpacity } from "@/components/custom/bottom-nav/use-indicator-opacity";

interface IBottomNavItemProps {
  entry: IBottomNavItem;
  isActive: boolean;
  /** Lit while a thumb is dragging over this cell */
  isScrubbed: boolean;
  /** A coming-soon cell nobody but an admin may open */
  isLocked: boolean;
  /** Holds the one active disc, which a thumb borrows while it scrubs */
  showsDisc: boolean;
  /** Resolved by the bar, so the ring cannot disagree with what a hold does */
  hasHold: boolean;
  indicatorOpacity: IndicatorOpacity;
  badgeCount?: number;
  /** How much of the active shopping list is ticked off, 0 to 1 */
  listProgress?: number;
  /** A re-tap would return to the saved scroll position */
  canReturn?: boolean;
  onKeyboardActivate: () => void;
}

/**
 * One cell of the bar. A button rather than a link, which is what makes the long
 * press viable: iOS shows a link-preview popover and a callout on a long-pressed
 * anchor, and `-webkit-touch-callout: none` is unreliable as of iOS 26. The
 * crawlable links for these routes already ship in the header and the sidebar.
 */
export default function BottomNavItem({
  entry,
  isActive,
  isScrubbed,
  isLocked,
  showsDisc,
  hasHold,
  indicatorOpacity,
  badgeCount,
  listProgress,
  canReturn,
  onKeyboardActivate,
}: IBottomNavItemProps) {
  const { item } = entry;

  // A locked cell is still `aria-current` when its route is open by URL, but it
  // must not look like a tab you arrived at by tapping it.
  const showsActive = isActive && !isLocked;
  const isPressed = isScrubbed && !isLocked;

  return (
    <li className={CELL_ITEM_CLASS} data-nav-cell>
      <button
        type="button"
        // aria-disabled, not disabled: browsers suppress pointer events on a
        // disabled control, so a press starting here would never reach the list
        // and you could not scrub off a locked cell onto a usable one.
        aria-disabled={isLocked || undefined}
        tabIndex={isLocked ? -1 : undefined}
        aria-current={isActive ? "page" : undefined}
        onClick={(event) => {
          if (isKeyboardClick(event)) onKeyboardActivate();
        }}
        className={cn(
          CELL_BUTTON_CLASS,
          "text-muted-foreground transition-colors duration-150 motion-reduce:transition-none",
          (showsActive || isPressed) && "text-primary",
          isLocked && "text-muted-foreground/70 cursor-not-allowed",
        )}
      >
        {/* The disc and both rings enclose icon and label together, so they come
            before them in paint order */}
        {showsDisc && <BottomNavIndicator opacity={indicatorOpacity} />}

        {listProgress !== undefined && (
          <BottomNavRing
            progress={listProgress}
            className="stroke-primary/50"
          />
        )}

        {hasHold && (
          <BottomNavRing
            progress="var(--press-progress, 0)"
            className="stroke-primary"
          />
        )}

        <BottomNavItemGlyph
          icon={item.icon}
          isPressed={isPressed}
          badgeCount={badgeCount}
          showsReturn={showsActive && canReturn}
        />

        <span className={cn(CELL_LABEL_CLASS, showsActive && "font-bold")}>
          {item.shortLabel ?? item.label}
        </span>

        {item.comingSoon && (
          // Rotated off the right edge, the convention the header nav and the
          // landing page already use.
          <ComingSoonBadge className="pointer-events-none absolute top-[0.1rem] right-0 rotate-6 px-1 py-0 text-[0.5rem] shadow-none" />
        )}
      </button>
    </li>
  );
}
