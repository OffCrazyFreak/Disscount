"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import BottomNavRing from "@/components/custom/bottom-nav/bottom-nav-ring";

interface IBottomNavCenterItemProps {
  label: string;
  isScrubbed: boolean;
  isSearchOpen: boolean;
  onKeyboardActivate: () => void;
}

/**
 * The search cell: raised and filled, so it reads as primary while keeping its
 * equal share of the row.
 *
 * Tap opens the search sheet rather than navigating. Holding it opens the
 * scanner, since typing a name and scanning a barcode answer the same question.
 */
export default function BottomNavCenterItem({
  label,
  isScrubbed,
  isSearchOpen,
  onKeyboardActivate,
}: IBottomNavCenterItemProps) {
  return (
    <li className="relative flex-1 [--press-progress:0]">
      <button
        type="button"
        aria-label={`${label}, traži`}
        aria-expanded={isSearchOpen}
        onClick={(event) => {
          if (event.detail === 0) onKeyboardActivate();
        }}
        className="relative flex size-full cursor-pointer flex-col items-center justify-center gap-[0.2rem] select-none [-webkit-touch-callout:none] [-webkit-user-drag:none]"
      >
        <span className="relative -translate-y-[0.3rem]">
          <BottomNavRing
            progress="var(--press-progress, 0)"
            className="stroke-primary/50 -inset-[0.3rem]"
          />

          <span
            className={cn(
              "bg-primary text-primary-foreground flex size-[2.6rem] items-center justify-center rounded-full shadow-md transition-transform duration-150",
              (isScrubbed || isSearchOpen) && "scale-105",
            )}
          >
            <Search className="size-[1.3rem]" />
          </span>
        </span>

        <span
          className={cn(
            "h-[var(--bottom-nav-label-height)] -translate-y-[0.15rem] overflow-hidden text-[0.65rem] leading-none tracking-tight opacity-[var(--bottom-nav-label-opacity)]",
            isScrubbed || isSearchOpen
              ? "text-primary"
              : "text-muted-foreground",
          )}
        >
          {label}
        </span>
      </button>
    </li>
  );
}
