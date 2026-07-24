"use client";

import { useMinuteTick } from "@/hooks/use-minute-tick";
import { formatRelativeTime } from "@/utils/date";
import { formatDateTime } from "@/utils/strings";

interface IRelativeTimeProps {
  value?: string | null;
  fallback?: string;
}

/**
 * Renders a server timestamp as "prije 5 minuta", with the full date and time
 * behind it. Shows the absolute value until mounted, because formatRelativeTime
 * reads Date.now() and would otherwise disagree with the server render.
 */
export default function RelativeTime({
  value,
  fallback = "-",
}: IRelativeTimeProps) {
  const mounted = useMinuteTick();

  const timestamp = value ? new Date(value).getTime() : Number.NaN;
  if (Number.isNaN(timestamp)) return <>{fallback}</>;

  const absolute = formatDateTime(value);
  if (!mounted) return <span>{absolute}</span>;

  return <span title={absolute}>{formatRelativeTime(timestamp)}</span>;
}
