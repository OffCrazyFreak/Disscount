import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime, formatDayMonth } from "@/utils/strings";

const MORNING = "2026-11-03T06:05:00Z";

describe("Croatian numeric dates", () => {
  it("writes two-digit day and month, no spaces, a dot after the year", () => {
    expect(formatDate(MORNING, "hr")).toBe("03.11.2026.");
  });

  it("keeps a two-digit day and month past the ninth", () => {
    expect(formatDate("2026-12-24T12:00:00Z", "hr")).toBe("24.12.2026.");
  });

  it("leaves the time as Intl writes it", () => {
    expect(formatDateTime(MORNING, "hr")).toBe("03.11.2026. 07:05");
  });

  it("drops the year on a day and month", () => {
    expect(formatDayMonth(MORNING, "hr")).toBe("03.11.");
  });

  it("treats an unknown locale as Croatian, like formatLocale does", () => {
    expect(formatDate(MORNING, "xx")).toBe("03.11.2026.");
  });
});

describe("the other languages keep their own format", () => {
  it.each([
    ["en", "3 Nov 2026", "3 Nov 2026, 07:05", "3 Nov"],
    ["de", "03.11.2026", "03.11.2026, 07:05", "03.11."],
    ["it", "03/11/2026", "03/11/2026, 07:05", "03/11"],
    ["sl", "03. 11. 2026", "03. 11. 2026, 07:05", "03. 11."],
  ])("%s", (locale, date, dateTime, dayMonth) => {
    expect(formatDate(MORNING, locale)).toBe(date);
    expect(formatDateTime(MORNING, locale)).toBe(dateTime);
    expect(formatDayMonth(MORNING, locale)).toBe(dayMonth);
  });
});

describe("input that is not a date", () => {
  it("renders nothing for a missing date", () => {
    expect(formatDate(null, "hr")).toBe("");
    expect(formatDate(undefined, "hr")).toBe("");
  });

  it("falls back to the original text", () => {
    expect(formatDate("not a date", "hr")).toBe("not a date");
  });
});
