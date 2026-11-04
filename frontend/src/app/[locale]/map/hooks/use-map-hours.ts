"use client";

import { useStoreHoursNow } from "@/components/custom/store-hours/use-store-hours-now";
import type { DirectoryStoreDto } from "@/lib/api/schemas";
import { useStoreHours } from "@/lib/api/store-hours";
import { openingOf } from "@/lib/store-hours/store-opening";
import {
  type OpenFilter,
  passesOpenFilter,
} from "@/app/[locale]/map/utils/open-filter";
import { toStoreKey } from "@/utils/store-key";

export function useMapHours(openFilter: OpenFilter) {
  const hours = useStoreHoursNow();
  const query = useStoreHours();
  // Offline with nothing cached, React Query pauses instead of failing.
  const hasHoursFailed =
    !query.data && (query.isError || query.fetchStatus === "paused");

  // Until the hours load, the filter waits rather than emptying the list; off, it passes nothing, so the minute clock does not rebuild every pin.
  const keep =
    hours && openFilter !== "off"
      ? (store: DirectoryStoreDto) =>
          passesOpenFilter(
            openingOf(toStoreKey(store.chain, store.code), hours),
            openFilter,
          )
      : undefined;

  return { hours, hasHoursFailed, retryHours: query.refetch, keep };
}
