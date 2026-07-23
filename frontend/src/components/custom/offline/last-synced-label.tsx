"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/date";
import { useOnlineStatus } from "@/hooks/use-online-status";

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
  // Relative time needs Date.now(), which would mismatch between server and client.
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  const isOnline = useOnlineStatus();

  useEffect(() => {
    setMounted(true);

    const intervalId = setInterval(() => setTick((tick) => tick + 1), 60_000);
    return () => clearInterval(intervalId);
  }, []);

  // Only meaningful while offline - when online the data is considered fresh.
  if (!mounted || !updatedAt || isOnline) return null;

  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {prefix} {formatRelativeTime(updatedAt)}
    </span>
  );
}
