"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import BottomNavIndicator from "@/components/custom/bottom-nav/bottom-nav-indicator";
import BottomNavRing from "@/components/custom/bottom-nav/bottom-nav-ring";
import type { IndicatorOpacity } from "@/components/custom/bottom-nav/use-indicator-opacity";

/** Both glyphs share the circle's centre and swap by rotating through it */
const ICON_CLASS =
  "absolute size-[1.6rem] transition-all duration-200 motion-reduce:transition-none";

interface IBottomNavCenterItemProps {
  label: string;
  /** On the catalogue route. Opening the sheet deliberately does not count */
  isActive: boolean;
  isScrubbed: boolean;
  isSearchOpen: boolean;
  indicatorOpacity: IndicatorOpacity;
  onKeyboardActivate: () => void;
}

/**
 * The search cell: raised and filled, so it reads as primary while keeping its
 * equal share of the row.
 *
 * Tap opens the search sheet rather than navigating, and taps again to close it,
 * which is what the glyph animates to say. Holding it opens the scanner, since
 * typing a name and scanning a barcode answer the same question.
 */
export default function BottomNavCenterItem({
  label,
  isActive,
  isScrubbed,
  isSearchOpen,
  indicatorOpacity,
  onKeyboardActivate,
}: IBottomNavCenterItemProps) {
  return (
    <li className="relative flex-1 [--press-progress:0]">
      <button
        type="button"
        aria-label={isSearchOpen ? "Zatvori traženje" : `${label}, traži`}
        aria-current={isActive ? "page" : undefined}
        aria-expanded={isSearchOpen}
        onClick={(event) => {
          if (event.detail === 0) onKeyboardActivate();
        }}
        className="relative flex size-full cursor-pointer flex-col items-center justify-center gap-[0.2rem] select-none [-webkit-touch-callout:none] [-webkit-user-drag:none]"
      >
        {isActive && <BottomNavIndicator opacity={indicatorOpacity} />}

        <BottomNavRing
          progress="var(--press-progress, 0)"
          className="stroke-primary/50"
        />

        <span
          className={cn(
            "bg-primary text-primary-foreground relative flex size-[2.8rem] -translate-y-[0.2rem] items-center justify-center rounded-full transition-transform duration-150",
            isScrubbed && "scale-105",
          )}
        >
          <Search
            className={cn(
              ICON_CLASS,
              isSearchOpen && "rotate-90 scale-50 opacity-0",
            )}
          />

          <X
            className={cn(
              ICON_CLASS,
              !isSearchOpen && "-rotate-90 scale-50 opacity-0",
            )}
          />
        </span>

        <span
          className={cn(
            "relative h-[var(--bottom-nav-label-height)] overflow-hidden text-[0.65rem] leading-none tracking-tight opacity-[var(--bottom-nav-label-opacity)]",
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
