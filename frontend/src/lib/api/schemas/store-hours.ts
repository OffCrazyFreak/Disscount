import { z } from "zod";

const clockTime = z.string().regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/);

const isoDate = z.iso.date();

/** Equal times are refused because feeds write a closed day as `00:00-00:00`. */
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
  /** `dated`: open only by dated entry, as the law lets traders pick 16 Sundays; `weekly`: exempt store. */
  sundays: sundayRuleSchema,
  source: hoursSourceSchema,
  verifiedAt: z.iso.datetime(),
  /** The store's own page where a shopper can check the hours, else the chain's store finder. */
  checkUrl: z.url({ protocol: /^https?$/ }).nullable(),
});

const tableIndex = z.number().int().nonnegative();

/** Most stores of a chain share a week, so each points into shared tables. */
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

export type StoreHoursResponse = Pick<
  CompactStoreHoursResponse,
  "holidays" | "generatedAt"
> & { stores: Record<string, StoreHoursDto> };
