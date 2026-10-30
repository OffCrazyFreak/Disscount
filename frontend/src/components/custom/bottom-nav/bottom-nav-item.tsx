"use client";

import { cn } from "@/lib/utils";
import { isKeyboardClick } from "@/utils/events";
import BottomNavItemGlyph from "@/components/custom/bottom-nav/bottom-nav-item-glyph";
import BottomNavItemLabel from "@/components/custom/bottom-nav/bottom-nav-item-label";
import BottomNavItemRings, {
  type IBottomNavItemRingsProps,
} from "@/components/custom/bottom-nav/bottom-nav-item-rings";
import {
  CELL_BUTTON_CLASS,
  CELL_ITEM_CLASS,
} from "@/components/custom/bottom-nav/bottom-nav-classes";
import type { IBottomNavItem } from "@/components/custom/bottom-nav/bottom-nav-items";

interface IBottomNavItemProps extends IBottomNavItemRingsProps {
  entry: IBottomNavItem;
  isActive: boolean;
  /** Lit while a thumb is dragging over this cell */
  isScrubbed: boolean;
  /** A coming-soon cell nobody but an admin may open */
  isLocked: boolean;
  badgeCount?: number;
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
  badgeCount,
  canReturn,
  onKeyboardActivate,
  ...rings
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
        <BottomNavItemRings {...rings} />

        <BottomNavItemGlyph
          icon={item.icon}
          isPressed={isPressed}
          badgeCount={badgeCount}
          showsReturn={showsActive && canReturn}
        />

        <BottomNavItemLabel item={item} isBold={showsActive} />
      </button>
    </li>
  );
}
