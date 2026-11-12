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
  /** The cell's accessible name while it shows a count, so the number is not visual only */
  badgeLabel?: string;
  /** A re-tap would return to the saved scroll position */
  canReturn?: boolean;
  onKeyboardActivate: () => void;
}

/** A button, because iOS shows a preview popover on a long-pressed anchor; other nav has crawlable links. */
export default function BottomNavItem({
  entry,
  isActive,
  isScrubbed,
  isLocked,
  badgeCount,
  badgeLabel,
  canReturn,
  onKeyboardActivate,
  ...rings
}: IBottomNavItemProps) {
  const { item } = entry;

  // A locked cell is still `aria-current` when open by URL, but must not look like a tab you arrived at by tapping it.
  const showsActive = isActive && !isLocked;
  const isPressed = isScrubbed && !isLocked;

  return (
    <li className={CELL_ITEM_CLASS} data-nav-cell>
      <button
        type="button"
        // aria-disabled, because a disabled control gets no pointer events, blocking a scrub off this cell.
        aria-disabled={isLocked || undefined}
        tabIndex={isLocked ? -1 : undefined}
        aria-current={isActive ? "page" : undefined}
        aria-label={badgeCount !== undefined ? badgeLabel : undefined}
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
        {/* The disc and rings enclose icon and label together, so they come first in paint order. */}
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
