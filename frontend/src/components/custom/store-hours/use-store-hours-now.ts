"use client";

import { useCurrentMinute } from "@/hooks/use-current-minute";
import { useStoreHours } from "@/lib/api/store-hours";
import type { IStoreHoursNow } from "@/lib/store-hours/store-opening";

/** Disabled, it neither fetches nor reads what a visit to the map cached. */
export function useStoreHoursNow({
  enabled = true,
}: { enabled?: boolean } = {}): IStoreHoursNow | null {
  const { data } = useStoreHours({ enabled });
  const now = useCurrentMinute({ enabled });

  return enabled && data && now
    ? { data, holidays: new Set(data.holidays), now }
    : null;
}
