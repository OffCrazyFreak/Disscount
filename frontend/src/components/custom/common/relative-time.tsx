"use client";

import { useLocale } from "next-intl";

import { useMinuteTick } from "@/hooks/use-minute-tick";
import { formatRelativeTime, parseServerDate } from "@/utils/date";
import { formatDateTime } from "@/utils/strings";

interface IRelativeTimeProps {
  value?: string | null;
  fallback?: string;
}

export default function RelativeTime({
  value,
  fallback = "-",
}: IRelativeTimeProps) {
  const mounted = useMinuteTick();
  const locale = useLocale();

  const timestamp = value ? parseServerDate(value).getTime() : Number.NaN;
  if (Number.isNaN(timestamp)) return <>{fallback}</>;

  const absolute = formatDateTime(value, locale);

  // formatRelativeTime reads Date.now(), so the server render would disagree.
  if (!mounted) return <span>{absolute}</span>;

  return <span title={absolute}>{formatRelativeTime(timestamp, locale)}</span>;
}
