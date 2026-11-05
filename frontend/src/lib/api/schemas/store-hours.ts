import { z } from "zod";

const clockTime = z.string().regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/);

const isoDate = z.iso.date();

/**
 * One opening interval, as in schema.org `opens` and `closes` or one
 * `07:00-21:00` span of an OSM `opening_hours` rule. A `closes` at or before
 * `opens` runs past midnight; `24:00` closes at the end of the day. Equal
 * times are refused, because feeds write a closed day as `00:00-00:00`.
 */
export const timeRangeDto = z
  .object({ opens: clockTime, closes: clockTime })
  .refine((range) => range.opens !== range.closes);

/** A day's intervals; empty means closed all day. */
const dayRangesDto = z.array(timeRangeDto);

export const hoursSourceSchema = z.enum(["chain", "osm"]);

export const sundayRuleSchema = z.enum(["dated", "weekly"]);

/** Hours that apply to one calendar day only, overriding the weekly template. */
export const datedHoursDto = z.object({
  date: isoDate,
  ranges: dayRangesDto,
  verifiedAt: z.iso.datetime(),
});

export const storeHoursDto = z.object({
  /** Monday first, as ISO 8601 counts. `null` means the source did not say. */
  weekly: z.array(dayRangesDto.nullable()).length(7),
  dated: z.array(datedHoursDto),
  /**
   * `dated`: a Sunday is open only when a dated entry says so, because the law
   * lets each trader pick its own 16 working Sundays. `weekly`: the store is
   * exempt and keeps its weekly Sunday hours.
   */
  sundays: sundayRuleSchema,
  source: hoursSourceSchema,
  verifiedAt: z.iso.datetime(),
  /** The store's own page where a shopper can check the hours, else the chain's store finder. */
  checkUrl: z.url({ protocol: /^https?$/ }).nullable(),
});

const tableIndex = z.number().int().nonnegative();

/**
 * The wire and cache form of the hours: most stores of a chain share a week
 * and a list of dated days, so each store points into shared tables instead of
 * repeating them. `decodeStoreHours` turns this back into `StoreHoursResponse`.
 */
export const compactStoreHoursResponse = z
  .object({
    weeklyTemplates: z.array(storeHoursDto.shape.weekly),
    /** The date that the day offsets in `datedLists` count from. */
    baseDate: isoDate,
    /** `[days from baseDate, ranges, index into verifiedTimes]` per entry. */
    datedLists: z.array(
      z.array(z.tuple([z.number().int(), dayRangesDto, tableIndex])),
    ),
    verifiedTimes: z.array(z.iso.datetime()),
    checkUrls: z.array(storeHoursDto.shape.checkUrl.unwrap()),
    /** `[weekly template, dated list, verified time, check URL, source, sundays]`. */
    stores: z.record(
      z.string(),
      z.tuple([
        tableIndex,
        tableIndex,
        tableIndex,
        tableIndex.nullable(),
        hoursSourceSchema,
        sundayRuleSchema,
      ]),
    ),
    /** Croatian public holidays around today, ISO dates. */
    holidays: z.array(isoDate),
    generatedAt: z.iso.datetime(),
    /** False until a template import has succeeded: empty or partial, not to be cached. */
    complete: z.boolean().optional(),
  })
  .refine(
    ({ weeklyTemplates, datedLists, verifiedTimes, checkUrls, stores }) => {
      const hasDanglingDatedEntry = datedLists.some((list) =>
        list.some(([, , verified]) => verified >= verifiedTimes.length),
      );

      return (
        !hasDanglingDatedEntry &&
        Object.values(stores).every(
          ([weekly, dated, verified, checkUrl]) =>
            weekly < weeklyTemplates.length &&
            dated < datedLists.length &&
            verified < verifiedTimes.length &&
            (checkUrl === null || checkUrl < checkUrls.length),
        )
      );
    },
  );

export type TimeRangeDto = z.infer<typeof timeRangeDto>;
export type DatedHoursDto = z.infer<typeof datedHoursDto>;
export type HoursSource = z.infer<typeof hoursSourceSchema>;
export type SundayRule = z.infer<typeof sundayRuleSchema>;
export type StoreHoursDto = z.infer<typeof storeHoursDto>;
export type CompactStoreHoursResponse = z.infer<
  typeof compactStoreHoursResponse
>;

/** The hours as the status function and the UI read them. */
export type StoreHoursResponse = Pick<
  CompactStoreHoursResponse,
  "holidays" | "generatedAt"
> & { stores: Record<string, StoreHoursDto> };
