"use client";

import type { RefCallback } from "react";
import { ChevronsDown, Search } from "lucide-react";
import BottomNavLabel from "@/components/custom/bottom-nav/bottom-nav-label";
import type { IBottomNavCellView } from "@/components/custom/bottom-nav/use-bottom-nav-cells";
import { isKeyboardClick } from "@/utils/events";
import { cn } from "@/lib/utils";

const GLYPH_CLASS =
  "absolute size-6 transition-all duration-200 motion-reduce:transition-none";

const RAISED_CLASS =
  "relative flex size-[44.8px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform duration-150 motion-reduce:transition-none";

interface IBottomNavCenterCellProps {
  view: IBottomNavCellView;
  isScrubbed: boolean;
  isSheetOpen: boolean;
  registerRef: RefCallback<HTMLElement>;
  onActivate: () => void;
}

/**
 * Tap to type, hold to scan. The glyph rotates to chevrons while the sheet is
 * open, because they point the way the sheet actually leaves, and because this
 * cell is the only thing that can close a sheet nothing outside it can dismiss.
 */
export default function BottomNavCenterCell({
  view,
  isScrubbed,
  isSheetOpen,
  registerRef,
  onActivate,
}: IBottomNavCenterCellProps) {
  return (
    <li ref={registerRef} className="relative flex flex-1">
      <button
        type="button"
        aria-expanded={isSheetOpen}
        aria-label={isSheetOpen ? "Zatvori traženje" : view.cell.item.label}
        aria-current={view.isActive ? "page" : undefined}
        className={cn(
          "relative flex flex-1 flex-col items-center justify-center gap-1",
          view.isActive ? "text-primary" : "text-muted-foreground",
        )}
        onClick={(event) => isKeyboardClick(event) && onActivate()}
      >
        <span className={cn(RAISED_CLASS, isScrubbed && "scale-110")}>
          <Search
            className={cn(GLYPH_CLASS, isSheetOpen && "rotate-90 opacity-0")}
          />

          <ChevronsDown
            className={cn(GLYPH_CLASS, !isSheetOpen && "-rotate-90 opacity-0")}
          />
        </span>

        <BottomNavLabel isActive={view.isActive}>
          {view.cell.item.label}
        </BottomNavLabel>
      </button>
    </li>
  );
}
