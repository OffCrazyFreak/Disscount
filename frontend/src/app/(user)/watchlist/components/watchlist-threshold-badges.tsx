"use client";

import { MouseEvent } from "react";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WatchType } from "@/lib/api";
import { WatchlistItemDto } from "@/lib/api/types";

interface IWatchlistThresholdBadgesProps {
  items: WatchlistItemDto[];
  disabled: boolean;
  isAchieved: (thresholdValue: number, watchType: WatchType) => boolean;
  onEdit: (event: MouseEvent<HTMLButtonElement>, watchType: WatchType) => void;
}

export default function WatchlistThresholdBadges({
  items,
  disabled,
  isAchieved,
  onEdit,
}: IWatchlistThresholdBadgesProps) {
  const sortedItems = [...items].sort((a, b) => {
    if (a.watchType === b.watchType) return 0;

    return a.watchType === WatchType.percentage ? -1 : 1;
  });

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      {sortedItems.map((item) => (
        <Badge
          key={item.id}
          variant="outline"
          asChild
          className={cn(
            "text-xs cursor-pointer gap-2",
            isAchieved(item.thresholdValue, item.watchType) &&
              "border-green-600 bg-green-50 text-green-700 font-bold",
          )}
        >
          <button
            type="button"
            onClick={(event) => onEdit(event, item.watchType)}
            disabled={disabled}
          >
            {item.watchType === "ABSOLUTE"
              ? `- ${item.thresholdValue.toFixed(2)}€`
              : `- ${Math.round(item.thresholdValue)}%`}
            <Pencil className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
