"use client";

import { Search } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import BottomNavRing from "@/components/custom/bottom-nav/bottom-nav-ring";
import { SEARCH_MORPH_LAYOUT_ID } from "@/components/custom/search/search-morph";

interface IBottomNavCenterItemProps {
  isScrubbed: boolean;
  /** Hidden while the sheet owns the morphing surface */
  isSearchOpen: boolean;
  onKeyboardActivate: () => void;
}

/**
 * The search cell: raised and filled, so it reads as primary while keeping its
 * equal share of the row. No label, because the magnifier is one of the few
 * glyphs that needs none, and because a 48px circle leaves no room for one.
 *
 * Tap opens a sheet rather than navigating. Holding it opens the scanner, since
 * typing a name and scanning a barcode answer the same question.
 */
export default function BottomNavCenterItem({
  isScrubbed,
  isSearchOpen,
  onKeyboardActivate,
}: IBottomNavCenterItemProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <li className="relative flex-1 [--press-progress:0]">
      <button
        type="button"
        aria-label="Traži proizvode"
        aria-expanded={isSearchOpen}
        onClick={(event) => {
          if (event.detail === 0) onKeyboardActivate();
        }}
        className="relative flex size-full cursor-pointer items-center justify-center select-none [-webkit-touch-callout:none] [-webkit-user-drag:none]"
      >
        <span className="relative -translate-y-[0.35rem]">
          <BottomNavRing
            progress="var(--press-progress, 0)"
            className="stroke-primary/50 -inset-[0.3rem]"
          />

          {!isSearchOpen && (
            <motion.span
              layoutId={SEARCH_MORPH_LAYOUT_ID}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 340, damping: 32 }
              }
              className={cn(
                "bg-primary text-primary-foreground flex size-[3rem] items-center justify-center rounded-full shadow-lg transition-transform duration-150",
                isScrubbed && "scale-105",
              )}
            >
              <Search className="size-[1.4rem]" />
            </motion.span>
          )}
        </span>
      </button>
    </li>
  );
}
