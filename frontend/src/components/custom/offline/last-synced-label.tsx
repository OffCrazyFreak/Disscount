"use client";

import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/date";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useMinuteTick } from "@/hooks/use-minute-tick";

interface ILastSyncedLabelProps {
  // React Query's `dataUpdatedAt` (epoch millis); 0 when there's no data yet.
  updatedAt: number;
  prefix?: string;
  className?: string;
}

export default function LastSyncedLabel({
  updatedAt,
  prefix = "Osvježeno",
  className,
}: ILastSyncedLabelProps) {
  const mounted = useMinuteTick();
  const isOnline = useOnlineStatus();

  // Only meaningful while offline - when online the data is considered fresh.
  if (!mounted || !updatedAt || isOnline) return null;

  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {prefix} {formatRelativeTime(updatedAt)}
    </span>
  );
}
