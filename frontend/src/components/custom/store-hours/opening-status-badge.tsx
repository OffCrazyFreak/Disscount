"use client";

import { Badge } from "@/components/ui/badge";
import OpeningStatusDetail from "@/components/custom/store-hours/opening-status-detail";
import { useOpeningStatusText } from "@/components/custom/store-hours/use-opening-status-text";
import type { OpeningStatus } from "@/lib/store-hours/opening-status";

interface IOpeningStatusBadgeProps {
  status: OpeningStatus;
  now: Date;
  /** Lets a row's accessible name include the status. */
  id?: string;
  /** Inside a card's toggle button, where a second control would nest a button in a button. */
  isInsideButton?: boolean;
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
  isInsideButton = false,
}: IOpeningStatusBadgeProps) {
  const describe = useOpeningStatusText();
  const { label, detail, name } = describe(status, now);
  const variant = VARIANTS[status.state];
  const className = "shadow-none sm:shadow-none";

  if (detail && !isInsideButton) {
    return (
      <OpeningStatusDetail id={id} name={name} detail={detail}>
        <Badge variant={variant} className={className}>
          {label}
        </Badge>
      </OpeningStatusDetail>
    );
  }

  if (name === label) {
    return (
      <Badge id={id} variant={variant} className={className}>
        {label}
      </Badge>
    );
  }

  return (
    <span id={id} className="inline-flex">
      <Badge variant={variant} className={className}>
        <span aria-hidden="true">{label}</span>
      </Badge>
      <span className="sr-only">{name}</span>
    </span>
  );
}
