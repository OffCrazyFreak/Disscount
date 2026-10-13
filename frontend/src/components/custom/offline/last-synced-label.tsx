"use client";

import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/date";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useMinuteTick } from "@/hooks/use-minute-tick";

interface ILastSyncedLabelProps {
  // React Query's `dataUpdatedAt` (epoch millis); 0 when there's no data yet.
  updatedAt: number;
  // A full message for the time, so each language can put it where it belongs.
  label?: (time: string) => string;
  className?: string;
}

export default function LastSyncedLabel({
  updatedAt,
  label,
  className,
}: ILastSyncedLabelProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const mounted = useMinuteTick();
  const isOnline = useOnlineStatus();

  // Only meaningful while offline - when online the data is considered fresh.
  if (!mounted || !updatedAt || isOnline) return null;

  const time = formatRelativeTime(updatedAt, locale);

  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {label ? label(time) : t("lastSynced.refreshed", { time })}
    </span>
  );
}
