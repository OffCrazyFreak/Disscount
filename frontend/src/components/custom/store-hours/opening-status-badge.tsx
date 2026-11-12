"use client";

import { Badge } from "@/components/ui/badge";
import DetailPopoverButton from "@/components/custom/common/detail-popover-button";
import { useOpeningStatusText } from "@/components/custom/store-hours/use-opening-status-text";
import type { OpeningStatus } from "@/lib/store-hours/opening-status";

interface IOpeningStatusBadgeProps {
  status: OpeningStatus;
  now: Date;
  /** Lets a row's accessible name include the status. */
  id?: string;
}

// Orange marks "soon" either way, as the owner decided: an open store about to close and a closed store about to open.
const VARIANTS = {
  open: "primarySoft",
  "closing-soon": "warningSoft",
  closed: "destructiveSoft",
  "opening-soon": "warningSoft",
  unconfirmed: "outline",
} as const;

export default function OpeningStatusBadge({
  status,
  now,
  id,
}: IOpeningStatusBadgeProps) {
  const describe = useOpeningStatusText();
  const { label, detail, name } = describe(status, now);
  const variant = VARIANTS[status.state];
  const className = "shadow-none sm:shadow-none";

  if (detail) {
    return (
      <DetailPopoverButton id={id} name={name} detail={detail}>
        <Badge variant={variant} className={className}>
          {label}
        </Badge>
      </DetailPopoverButton>
    );
  }

  return (
    <Badge id={id} variant={variant} className={className}>
      {label}
    </Badge>
  );
}
