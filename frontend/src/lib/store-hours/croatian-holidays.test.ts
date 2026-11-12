import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { croatianHolidaysBetween } =
  await import("@/lib/store-hours/croatian-holidays");

describe("croatianHolidaysBetween", () => {
  it("spans the new year and keeps only days off by law", () => {
    expect(croatianHolidaysBetween("2026-12-28", "2027-02-28")).toEqual([
      "2027-01-01",
      "2027-01-06",
    ]);
  });

  it("includes the movable feasts", () => {
    const holidays = croatianHolidaysBetween("2027-03-01", "2027-06-30");

    expect(holidays).toEqual([
      "2027-03-28",
      "2027-03-29",
      "2027-05-01",
      "2027-05-27",
      "2027-05-30",
      "2027-06-22",
    ]);
  });

  it("knows the days added in 2020", () => {
    expect(croatianHolidaysBetween("2026-11-02", "2026-12-31")).toEqual([
      "2026-11-18",
      "2026-12-25",
      "2026-12-26",
    ]);
  });
});
