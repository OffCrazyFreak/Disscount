"use client";

import OpeningStatusBadge from "@/components/custom/store-hours/opening-status-badge";
import { useStoreOpening } from "@/components/custom/store-hours/store-hours-context";

interface IStoreOpeningBadgeProps {
  /** `chain:code`, as `toStoreKey` builds it. */
  storeKey: string;
  id?: string;
  isInsideButton?: boolean;
}

/** A physical store's badge; nothing until the hours load, so no badge flashes a wrong state. */
export default function StoreOpeningBadge({
  storeKey,
  id,
  isInsideButton,
}: IStoreOpeningBadgeProps) {
  const opening = useStoreOpening(storeKey);

  if (!opening) return null;

  return (
    <OpeningStatusBadge
      status={opening.status}
      now={opening.now}
      id={id}
      isInsideButton={isInsideButton}
    />
  );
}
