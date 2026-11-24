"use client";

import { useStoreHoursNow } from "@/components/custom/store-hours/use-store-hours-now";
import type { DirectoryStoreDto } from "@/lib/api/schemas";
import { useStoreHours } from "@/lib/api/store-hours";
import { openingOf } from "@/lib/store-hours/status/store-opening";
import {
  type OpenFilter,
  passesOpenFilter,
} from "@/features/map/utils/stores/open-filter";
import { toStoreKey } from "@/utils/geo/store-key";

export function useMapHours(openFilter: OpenFilter) {
  const hours = useStoreHoursNow();
  const query = useStoreHours();
  // Offline with nothing cached, React Query pauses instead of failing.
  const hasHoursFailed =
    !query.data && (query.isError || query.fetchStatus === "paused");

  // The filter waits for hours rather than emptying the list; off, the clock rebuilds no pins.
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
