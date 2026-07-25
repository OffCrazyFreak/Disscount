"use client";

import type { RefCallback } from "react";
import { ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import BottomNavLabel from "@/components/custom/bottom-nav/bottom-nav-label";
import BottomNavRings from "@/components/custom/bottom-nav/bottom-nav-rings";
import type { IBottomNavCellView } from "@/components/custom/bottom-nav/use-bottom-nav-cells";
import { isKeyboardClick } from "@/utils/events";
import { cn } from "@/lib/utils";

interface IBottomNavCellProps {
  view: IBottomNavCellView;
  isScrubbed: boolean;
  /** The open list's ticked share, passed only to the cell that owns lists */
  completion: number | null;
  canReturn: boolean;
  registerRef: RefCallback<HTMLElement>;
  onActivate: () => void;
}

export default function BottomNavCell({
  view,
  isScrubbed,
  completion,
  canReturn,
  registerRef,
  onActivate,
}: IBottomNavCellProps) {
  const { cell, isActive, isLocked, badgeCount } = view;
  const Icon = cell.item.icon;

  return (
    <li ref={registerRef} className="relative flex flex-1">
      <button
        type="button"
        disabled={isLocked}
        aria-current={isActive ? "page" : undefined}
        // The tone sits here so the icon and the label both inherit it.
        className={cn(
          "relative flex flex-1 flex-col items-center justify-center gap-1",
          isLocked && "text-muted-foreground/60",
          !isLocked && (isActive ? "text-primary" : "text-muted-foreground"),
        )}
        onClick={(event) => isKeyboardClick(event) && onActivate()}
      >
        <BottomNavRings completion={completion} />

        <span className="relative flex items-center justify-center">
          <Icon
            className={cn(
              "size-6 transition-transform duration-150 motion-reduce:transition-none",
              isScrubbed && "scale-125",
            )}
          />

          {badgeCount !== undefined && (
            <Badge size="count" className="absolute -top-2 -right-3">
              {badgeCount}
            </Badge>
          )}

          {isActive && canReturn && (
            <ChevronUp className="absolute -top-3 size-3" />
          )}
        </span>

        <BottomNavLabel isActive={isActive}>
          {cell.item.shortLabel ?? cell.item.label}
        </BottomNavLabel>

        {cell.item.comingSoon && (
          <ComingSoonBadge className="absolute top-0 right-0 origin-top-right scale-[0.65]" />
        )}
      </button>
    </li>
  );
}
