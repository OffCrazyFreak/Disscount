"use client";

import { Badge } from "@/components/ui/badge";
import { useOpeningStatusText } from "@/components/custom/store-hours/use-opening-status-text";
import type { OpeningStatus } from "@/lib/store-hours/opening-status";

interface IOpeningStatusBadgeProps {
  status: OpeningStatus;
  now: Date;
  /** Lets a row's accessible name include the status. */
  id?: string;
}

const VARIANTS = {
  open: "primarySoft",
  "closing-soon": "warningSoft",
  closed: "destructiveSoft",
  unconfirmed: "outline",
} as const;

/**
 * "Otvoreno · zatvara u 21:00" and its siblings. The word always carries the
 * meaning; the colour only repeats it.
 */
export default function OpeningStatusBadge({
  status,
  now,
  id,
}: IOpeningStatusBadgeProps) {
  const describe = useOpeningStatusText();
  const { label, detail } = describe(status, now);

  return (
    <span id={id} className="flex min-w-0 items-center gap-1.5 text-xs">
      <Badge
        variant={VARIANTS[status.state]}
        className="shadow-none sm:shadow-none"
      >
        {label}
      </Badge>
      {detail && (
        <span className="truncate text-muted-foreground">{detail}</span>
      )}
    </span>
  );
}
