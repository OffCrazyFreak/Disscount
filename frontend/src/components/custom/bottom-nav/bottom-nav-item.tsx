"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import BottomNavIndicator from "@/components/custom/bottom-nav/bottom-nav-indicator";
import BottomNavRing from "@/components/custom/bottom-nav/bottom-nav-ring";
import type { IBottomNavItem } from "@/components/custom/bottom-nav/bottom-nav-items";
import type { IndicatorOpacity } from "@/components/custom/bottom-nav/use-indicator-opacity";

interface IBottomNavItemProps {
  entry: IBottomNavItem;
  isActive: boolean;
  /** Previewed while a thumb is dragging over this cell */
  isScrubbed: boolean;
  /** A coming-soon cell nobody but an admin may open */
  isLocked: boolean;
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
  indicatorOpacity,
  badgeCount,
  listProgress,
  canReturn,
  onKeyboardActivate,
}: IBottomNavItemProps) {
  const { item, longPressTarget, longPressEnabled } = entry;

  const Icon = item.icon;
  const label = item.shortLabel ?? item.label;
  const hasLongPress =
    Boolean(longPressTarget && longPressEnabled) && !isLocked;
  const showCount = Boolean(item.badge && badgeCount);
  // A locked cell is still `aria-current` when its route is open by URL, but it
  // must not look like a tab you arrived at by tapping it.
  const showsActive = isActive && !isLocked;
  const isPressed = isScrubbed && !isLocked;
  const isLit = showsActive || isPressed;

  return (
    <li className="relative flex-1 [--press-progress:0]">
      <button
        type="button"
        disabled={isLocked}
        aria-current={isActive ? "page" : undefined}
        // Pointer activation runs on the list, which captures the pointer and so
        // retargets the click. Keyboard clicks arrive with detail 0.
        onClick={(event) => {
          if (event.detail === 0) onKeyboardActivate();
        }}
        className={cn(
          "text-muted-foreground relative flex size-full cursor-pointer flex-col items-center justify-center gap-[0.2rem] select-none transition-colors duration-150",
          "[-webkit-touch-callout:none] [-webkit-user-drag:none]",
          isLit && "text-primary",
          isLocked && "text-muted-foreground/70 cursor-not-allowed",
        )}
      >
        {/* The disc and both rings enclose icon and label together, so they come
            before them in paint order */}
        {showsActive && <BottomNavIndicator opacity={indicatorOpacity} />}

        {listProgress !== undefined && (
          <BottomNavRing
            progress={listProgress}
            className="stroke-primary/50"
          />
        )}

        {hasLongPress && (
          <BottomNavRing
            progress="var(--press-progress, 0)"
            className="stroke-primary"
          />
        )}

        <span className="relative flex items-center justify-center">
          <Icon
            className={cn(
              "relative size-[1.5rem] transition-transform duration-150",
              isPressed && "scale-115",
            )}
          />

          {showCount && (
            <Badge size="count" className="absolute -top-2 -right-3">
              {badgeCount}
            </Badge>
          )}

          {showsActive && canReturn && (
            <ChevronDown
              aria-hidden="true"
              className="text-primary absolute -bottom-2 size-[0.7rem]"
            />
          )}
        </span>

        <span
          className={cn(
            "relative h-[var(--bottom-nav-label-height)] overflow-hidden text-[0.65rem] leading-none tracking-tight opacity-[var(--bottom-nav-label-opacity)]",
            showsActive && "font-bold",
          )}
        >
          {label}
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
