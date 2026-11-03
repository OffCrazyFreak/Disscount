import type { StoreHoursResponse } from "@/lib/api/schemas";
import {
  type OpeningStatus,
  openingStatusAt,
} from "@/lib/store-hours/opening-status";

/** The hours response, its holidays as a set, and the minute they are judged at. */
export interface IStoreHoursNow {
  data: StoreHoursResponse;
  holidays: ReadonlySet<string>;
  now: Date;
}

/** A store we hold no hours for is as unconfirmed as one whose data went stale. */
export function openingOf(key: string, hours: IStoreHoursNow): OpeningStatus {
  const store = hours.data.stores[key];

  return store
    ? openingStatusAt(store, hours.holidays, hours.now)
    : { state: "unconfirmed", asOf: null };
}
