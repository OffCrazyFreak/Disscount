"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/date";

interface LastSyncedLabelProps {
  // React Query's `dataUpdatedAt` (epoch millis); 0 when there's no data yet.
  updatedAt: number;
  prefix?: string;
  className?: string;
}

export default function LastSyncedLabel({
  updatedAt,
  prefix,
  className,
}: LastSyncedLabelProps) {
  const t = useTranslations("offline");
  // Render only after mount (relative time depends on `Date.now()`, which would
  // otherwise mismatch between server and client) and re-render each minute so
  // the label stays current.
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);

    const intervalId = setInterval(() => setTick((tick) => tick + 1), 60_000);
    return () => clearInterval(intervalId);
  }, []);

  if (!mounted || !updatedAt) return null;

  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {prefix ?? t("refreshed")} {formatRelativeTime(updatedAt)}
    </span>
  );
}
