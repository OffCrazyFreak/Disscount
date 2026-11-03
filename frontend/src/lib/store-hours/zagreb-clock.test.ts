import { describe, expect, it } from "vitest";

import {
  addDays,
  isoWeekday,
  zagrebClock,
} from "@/lib/store-hours/zagreb-clock";

describe("zagrebClock", () => {
  it("reads Zagreb's wall clock, not the device's", () => {
    expect(zagrebClock(new Date("2026-11-04T23:30:00Z"))).toStrictEqual({
      date: "2026-11-05",
      minutes: 30,
    });
  });

  it("follows summer time", () => {
    expect(zagrebClock(new Date("2026-03-29T01:30:00Z"))).toStrictEqual({
      date: "2026-03-29",
      minutes: 3 * 60 + 30,
    });
  });
});

describe("calendar helpers", () => {
  it("crosses month and year ends", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts Monday as 0 and Sunday as 6", () => {
    expect(isoWeekday("2026-11-02")).toBe(0);
    expect(isoWeekday("2026-11-08")).toBe(6);
  });
});
