"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import OpeningStatusDetail from "@/components/custom/store-hours/opening-status-detail";
import { useOpeningStatusText } from "@/components/custom/store-hours/use-opening-status-text";
import type { OpeningStatus } from "@/lib/store-hours/opening-status";

interface IOpeningStatusBadgeProps {
  status: OpeningStatus;
  now: Date;
  /** Lets a row's accessible name include the status. */
  id?: string;
}

// Orange marks "soon" either way, as the owner decided: an open store about
// to close and a closed store about to open.
const VARIANTS = {
  open: "primarySoft",
  "closing-soon": "warningSoft",
  closed: "destructiveSoft",
  "opening-soon": "warningSoft",
  unconfirmed: "outline",
} as const;

/** "Otvoreno" or "Zatvoreno", with the time it changes in a tooltip and in its accessible name. */
export default function OpeningStatusBadge({
  status,
  now,
  id,
}: IOpeningStatusBadgeProps) {
  const describe = useOpeningStatusText();
  const { label, detail, name } = describe(status, now);
  const variant = VARIANTS[status.state];
  // The shared amber-600 on amber-50 is about 3:1, short of 4.5:1 for small text.
  const className = cn(
    "shadow-none sm:shadow-none",
    variant === "warningSoft" && "text-amber-700",
  );

  if (detail) {
    return (
      <OpeningStatusDetail id={id} name={name} detail={detail}>
        <Badge variant={variant} className={className}>
          {label}
        </Badge>
      </OpeningStatusDetail>
    );
  }

  return (
    <Badge id={id} variant={variant} className={className}>
      {label}
    </Badge>
  );
}
