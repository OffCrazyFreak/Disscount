"use client";

import { ChevronsDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { isKeyboardClick } from "@/utils/events";
import BottomNavIndicator from "@/components/custom/bottom-nav/bottom-nav-indicator";
import BottomNavRing from "@/components/custom/bottom-nav/bottom-nav-ring";
import {
  CELL_BUTTON_CLASS,
  CELL_ITEM_CLASS,
  CELL_LABEL_CLASS,
} from "@/components/custom/bottom-nav/bottom-nav-classes";
import type { IndicatorOpacity } from "@/components/custom/bottom-nav/use-indicator-opacity";

/** Both glyphs share the circle's centre and swap by rotating through it */
const ICON_CLASS =
  "absolute size-[1.6rem] transition-all duration-200 motion-reduce:transition-none";

interface IBottomNavCenterItemProps {
  label: string;
  /** On the catalogue route. Opening the sheet deliberately does not count */
  isActive: boolean;
  isScrubbed: boolean;
  /** Holds the one active disc, which a thumb borrows while it scrubs */
  showsDisc: boolean;
  isSearchOpen: boolean;
  indicatorOpacity: IndicatorOpacity;
  onKeyboardActivate: () => void;
}

/**
 * The search cell: raised and filled, so it reads as primary while keeping its
 * equal share of the row.
 *
 * Tap opens the products sheet rather than navigating, and taps again to close it,
 * which is what the glyph animates to say: the chevrons point the way the sheet
 * leaves, matching the swipe that also closes it. Holding it opens the scanner,
 * since typing a name and scanning a barcode answer the same question.
 */
export default function BottomNavCenterItem({
  label,
  isActive,
  isScrubbed,
  showsDisc,
  isSearchOpen,
  indicatorOpacity,
  onKeyboardActivate,
}: IBottomNavCenterItemProps) {
  return (
    <li className={CELL_ITEM_CLASS} data-nav-cell>
      <button
        type="button"
        // The visible word stays in the name in both states, so speech control
        // can still address the cell while the sheet is open (WCAG 2.5.3).
        aria-label={isSearchOpen ? `${label}, zatvori` : `${label}, traži`}
        aria-current={isActive ? "page" : undefined}
        aria-expanded={isSearchOpen}
        onClick={(event) => {
          if (isKeyboardClick(event)) onKeyboardActivate();
        }}
        className={CELL_BUTTON_CLASS}
      >
        {showsDisc && <BottomNavIndicator opacity={indicatorOpacity} />}

        {/* Always present, since holding this cell always opens the scanner */}
        <BottomNavRing
          progress="var(--press-progress, 0)"
          className="stroke-primary"
        />

        <span
          className={cn(
            "bg-primary text-primary-foreground relative flex size-[2.8rem] -translate-y-[0.2rem] items-center justify-center rounded-full transition-transform duration-150 motion-reduce:transition-none",
            isScrubbed && "scale-105",
          )}
        >
          <Search
            className={cn(
              ICON_CLASS,
              isSearchOpen && "rotate-90 scale-50 opacity-0",
            )}
          />

          <ChevronsDown
            className={cn(
              ICON_CLASS,
              !isSearchOpen && "-rotate-90 scale-50 opacity-0",
            )}
          />
        </span>

        <span
          className={cn(
            CELL_LABEL_CLASS,
            isActive ? "text-primary font-bold" : "text-muted-foreground",
            isScrubbed && "text-primary",
          )}
        >
          {label}
        </span>
      </button>
    </li>
  );
}
