"use client";

import { useCurrentMinute } from "@/hooks/use-current-minute";
import { useStoreHours } from "@/lib/api/store-hours";
import type { IStoreHoursNow } from "@/lib/store-hours/store-opening";

/**
 * Every store's hours and the current minute, or null until both are in.
 * Disabled, it neither fetches nor reads what a visit to the map cached.
 */
export function useStoreHoursNow({
  enabled = true,
}: { enabled?: boolean } = {}): IStoreHoursNow | null {
  const { data } = useStoreHours({ enabled });
  const now = useCurrentMinute();

  return enabled && data && now
    ? { data, holidays: new Set(data.holidays), now }
    : null;
}
