"use client";

import { useMinuteTick } from "@/hooks/use-minute-tick";
import { formatRelativeTime } from "@/utils/date";
import { formatDateTime } from "@/utils/strings";

interface IRelativeTimeProps {
  value?: string | null;
  fallback?: string;
}

/** A server timestamp as "prije 5 minuta", with the full date and time behind it. */
export default function RelativeTime({
  value,
  fallback = "-",
}: IRelativeTimeProps) {
  const mounted = useMinuteTick();

  const timestamp = value ? new Date(value).getTime() : Number.NaN;
  if (Number.isNaN(timestamp)) return <>{fallback}</>;

  const absolute = formatDateTime(value);

  // formatRelativeTime reads Date.now(), so the server render would disagree.
  if (!mounted) return <span>{absolute}</span>;

  return <span title={absolute}>{formatRelativeTime(timestamp)}</span>;
}
