import type { SundayRule, TimeRangeDto } from "@/lib/api/schemas";
import type { ILocatorStore } from "@/lib/store-locations/store-location-types";

export interface IDatedRanges {
  date: string;
  ranges: TimeRangeDto[];
}

export interface IParsedHours {
  /** Monday first; `null` for a day the source does not describe. */
  weekly: (TimeRangeDto[] | null)[];
  dated: IDatedRanges[];
  /** Set only when the source states the store keeps its Sunday hours every week. */
  sundays?: SundayRule;
}

/** A source without coordinates (Studenac) is matched by code alone. */
export interface IHoursRecord extends Omit<ILocatorStore, "lat" | "lon"> {
  lat?: number;
  lon?: number;
  hours: IParsedHours;
}

export interface IHoursSource {
  chain: string;
  /** `codes` are upstream's store codes for the chain, so a crawl can skip the rest. */
  fetchHours(
    signal: AbortSignal,
    codes: ReadonlySet<string>,
  ): Promise<IHoursRecord[]>;
}
