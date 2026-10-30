"use client";

import { cn } from "@/lib/utils";
import BottomNavIndicator from "@/components/custom/bottom-nav/bottom-nav-indicator";
import HoldProgressRing from "@/components/custom/common/hold-progress-ring";
import { CELL_DISC_CLASS } from "@/components/custom/bottom-nav/bottom-nav-classes";
import type { IndicatorOpacity } from "@/components/custom/bottom-nav/use-indicator-opacity";

export interface IBottomNavItemRingsProps {
  /** Holds the one active disc, which a thumb borrows while it scrubs */
  showsDisc: boolean;
  indicatorOpacity: IndicatorOpacity;
  /** How much of the active shopping list is ticked off, 0 to 1 */
  listProgress?: number;
  /** Resolved by the bar, so the ring cannot disagree with what a hold does */
  hasHold: boolean;
}

/** The disc and both rings, which enclose a cell's icon and label together. */
export default function BottomNavItemRings({
  showsDisc,
  indicatorOpacity,
  listProgress,
  hasHold,
}: IBottomNavItemRingsProps) {
  return (
    <>
      {showsDisc && <BottomNavIndicator opacity={indicatorOpacity} />}

      {listProgress !== undefined && (
        <HoldProgressRing
          progress={listProgress}
          className={cn(CELL_DISC_CLASS, "stroke-primary/50")}
        />
      )}

      {hasHold && (
        <HoldProgressRing
          progress="var(--press-progress, 0)"
          className={cn(CELL_DISC_CLASS, "stroke-primary")}
        />
      )}
    </>
  );
}
