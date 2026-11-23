import { describe, expect, it } from "vitest";

import type { StoreHoursDto, TimeRangeDto } from "@/lib/api/schemas";
import { weekHoursOf } from "@/lib/store-hours/week-hours";

const VERIFIED = "2026-11-02T06:00:00.000Z";
const day: TimeRangeDto[] = [{ opens: "07:00", closes: "21:00" }];
const short: TimeRangeDto[] = [{ opens: "07:00", closes: "14:00" }];

function hours(overrides: Partial<StoreHoursDto> = {}): StoreHoursDto {
  return {
    weekly: [day, day, day, day, day, day, []],
    dated: [],
    sundays: "dated",
    source: "chain",
    verifiedAt: VERIFIED,
    checkUrl: null,
    ...overrides,
  };
}

const noHolidays = new Set<string>();

// 2026-11-04 is a Wednesday, so the week runs Wednesday to Tuesday.
const wednesday = new Date("2026-11-04T10:00:00+01:00");

describe("weekHoursOf", () => {
  it("starts today and runs seven days", () => {
    const week = weekHoursOf(hours(), noHolidays, wednesday);

    expect(week.map((row) => row.date)).toStrictEqual([
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
      "2026-11-09",
      "2026-11-10",
    ]);
    expect(week.map((row) => row.isToday)).toStrictEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(week[0]).toMatchObject({ weekday: 2, ranges: day });
  });

  it("leaves a Sunday under the trading law unknown and flags it", () => {
    const sunday = weekHoursOf(hours(), noHolidays, wednesday)[4];

    expect(sunday).toMatchObject({ ranges: null, isRestrictedSunday: true });
  });

  it("uses the template on Sunday for an exempt store", () => {
    const exempt = hours({ sundays: "weekly", weekly: Array(7).fill(day) });
    const sunday = weekHoursOf(exempt, noHolidays, wednesday)[4];

    expect(sunday).toMatchObject({ ranges: day, isRestrictedSunday: false });
  });

  it("closes on a holiday", () => {
    const thursday = weekHoursOf(
      hours(),
      new Set(["2026-11-05"]),
      wednesday,
    )[1];

    expect(thursday).toMatchObject({
      ranges: [],
      isHoliday: true,
      isException: false,
    });
  });

  it("flags a dated entry only when it differs from the template", () => {
    const week = weekHoursOf(
      hours({
        dated: [
          { date: "2026-11-05", ranges: day, verifiedAt: VERIFIED },
          { date: "2026-11-06", ranges: short, verifiedAt: VERIFIED },
        ],
      }),
      noHolidays,
      wednesday,
    );

    expect(week[1].isException).toBe(false);
    expect(week[2]).toMatchObject({ ranges: short, isException: true });
  });

  it("reads equal hours as equal whatever their key order", () => {
    const reordered = [{ closes: "21:00", opens: "07:00" }];
    const week = weekHoursOf(
      hours({
        dated: [
          { date: "2026-11-05", ranges: reordered, verifiedAt: VERIFIED },
        ],
      }),
      noHolidays,
      wednesday,
    );

    expect(week[1].isException).toBe(false);
  });

  it("marks hours a store keeps on a holiday as special", () => {
    const thursday = weekHoursOf(
      hours({
        dated: [{ date: "2026-11-05", ranges: short, verifiedAt: VERIFIED }],
      }),
      new Set(["2026-11-05"]),
      wednesday,
    )[1];

    expect(thursday).toMatchObject({
      ranges: short,
      isHoliday: true,
      isException: true,
    });
  });

  it("leaves a holiday unknown at an exempt store", () => {
    const exempt = hours({ sundays: "weekly", weekly: Array(7).fill(day) });
    const thursday = weekHoursOf(exempt, new Set(["2026-11-05"]), wednesday)[1];

    expect(thursday).toMatchObject({ ranges: null, isHoliday: true });
  });

  it("leaves a day the source skipped unknown", () => {
    const partial = hours({ weekly: [null, day, day, day, day, day, []] });
    const monday = weekHoursOf(partial, noHolidays, wednesday)[5];

    expect(monday).toMatchObject({ ranges: null, isRestrictedSunday: false });
  });

  it("knows nothing once the data is stale", () => {
    const stale = weekHoursOf(
      hours({ verifiedAt: "2026-10-01T06:00:00.000Z" }),
      noHolidays,
      wednesday,
    );

    expect(stale.every((row) => row.ranges === null)).toBe(true);
  });
});
