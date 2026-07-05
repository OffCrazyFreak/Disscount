"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/date";
import { useOnlineStatus } from "@/hooks/use-online-status";

interface LastSyncedLabelProps {
  // React Query's `dataUpdatedAt` (epoch millis); 0 when there's no data yet.
  updatedAt: number;
  prefix?: string;
  className?: string;
}

export default function LastSyncedLabel({
  updatedAt,
  prefix = "Osvježeno",
  className,
}: LastSyncedLabelProps) {
  // Render only after mount (relative time depends on `Date.now()`, which would
  // otherwise mismatch between server and client) and re-render each minute so
  // the label stays current.
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
