"use client";

import { ChevronsDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import BottomNavCompletionRing from "@/components/custom/bottom-nav/bottom-nav-completion-ring";
import BottomNavHoldRing from "@/components/custom/bottom-nav/bottom-nav-hold-ring";
import type { IBottomNavCell } from "@/components/custom/bottom-nav/bottom-nav-cells";
import { cn } from "@/lib/utils";

interface IBottomNavCellProps {
  cell: IBottomNavCell;
  index: number;
  isActive: boolean;
  isLocked: boolean;
  isScrubbed: boolean;
  isSheetOpen: boolean;
  notificationCount: number;
  shoppingListId: string | null;
  hasReturnPosition: boolean;
  onActivate: (index: number) => void;
}

/**
 * A real button, never an anchor: iOS answers a long-pressed anchor with a link
 * preview, a text callout and a drag affordance, and the property that should
 * suppress the callout is unreliable. The header and sidebar still carry the
 * links, so crawlability is unaffected.
 */
export default function BottomNavCell({
  cell,
  index,
  isActive,
  isLocked,
  isScrubbed,
  isSheetOpen,
  notificationCount,
  shoppingListId,
  hasReturnPosition,
  onActivate,
}: IBottomNavCellProps) {
  const { item } = cell;
  const Icon = item.icon;
  const isToggle = Boolean(cell.togglesSearchSheet);
  const showsChevrons = isToggle && isSheetOpen;

  return (
    <button
      type="button"
      data-nav-cell={index}
      data-long-press
      disabled={isLocked}
      aria-current={isActive ? "page" : undefined}
      aria-expanded={isToggle ? isSheetOpen : undefined}
      aria-label={showsChevrons ? "Zatvori traženje" : undefined}
      onClick={() => onActivate(index)}
      className={cn(
        "relative flex size-full min-h-12 min-w-12 flex-col items-center justify-center gap-1 select-none",
        isLocked
          ? "text-muted-foreground/50"
          : isActive
            ? "text-primary"
            : "text-muted-foreground",
      )}
    >
      {cell.indicator === "completion-ring" && shoppingListId && (
        <BottomNavCompletionRing listId={shoppingListId} />
      )}

      <BottomNavHoldRing />

      <span
        className={cn(
          "relative flex items-center justify-center transition-transform duration-150 motion-reduce:transition-none",
          cell.raised &&
            "size-[var(--bottom-nav-raised-size)] rounded-full bg-primary text-primary-foreground shadow-sm",
          isScrubbed && !isLocked && "scale-115",
        )}
      >
        <Icon
          className={cn(
            "size-6 transition-[opacity,rotate] duration-200 motion-reduce:transition-none",
            showsChevrons && "rotate-90 opacity-0",
          )}
        />

        {isToggle && (
          <ChevronsDown
            className={cn(
              "absolute size-6 transition-[opacity,rotate] duration-200 motion-reduce:transition-none",
              showsChevrons ? "rotate-0 opacity-100" : "-rotate-90 opacity-0",
            )}
          />
        )}

        {cell.indicator === "badge" && notificationCount > 0 && (
          <Badge size="count" className="absolute -top-2 -right-3">
            {notificationCount}
          </Badge>
        )}

        {isActive && hasReturnPosition && (
          <ChevronUp aria-hidden className="absolute -top-3 size-3" />
        )}
      </span>

      <span
        data-nav-label
        className="overflow-hidden text-[10.4px] leading-none"
        style={{
          height: "var(--nav-label-height, 0.85rem)",
          opacity: "var(--nav-label-opacity, 1)",
        }}
      >
        <span className={cn(isActive && "font-bold")}>
          {item.shortLabel ?? item.label}
        </span>
      </span>

      {item.comingSoon && (
        <ComingSoonBadge className="absolute -top-1 px-1 py-0 text-[7px] leading-tight" />
      )}
    </button>
  );
}
