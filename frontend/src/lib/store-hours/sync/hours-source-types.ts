import type { SundayRule, TimeRangeDto } from "@/lib/api/schemas";
import type { ILocatorStore } from "@/lib/store-locations/store-location-types";

/** One day a chain publishes on its own: a holiday, an announced Sunday. */
export interface IDatedRanges {
  date: string;
  ranges: TimeRangeDto[];
}

/** A store's hours as one source publishes them. */
export interface IParsedHours {
  /** Monday first; `null` for a day the source does not describe. */
  weekly: (TimeRangeDto[] | null)[];
  dated: IDatedRanges[];
  /** Set only when the source states the store keeps its Sunday hours every week. */
  sundays?: SundayRule;
}

/**
 * A store record with its hours, matched to upstream like a locator record.
 * A source without coordinates (Studenac) is matched by code alone.
 */
export interface IHoursRecord extends Omit<ILocatorStore, "lat" | "lon"> {
  lat?: number;
  lon?: number;
  hours: IParsedHours;
}

/** Reads every store a chain publishes, with hours. */
export interface IHoursSource {
  chain: string;
  /** `codes` are upstream's store codes for the chain, so a crawl can skip the rest. */
  fetchHours(
    signal: AbortSignal,
    codes: ReadonlySet<string>,
  ): Promise<IHoursRecord[]>;
}
