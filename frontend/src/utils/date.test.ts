import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildDateWindow,
  formatRelativeTime,
  fromLocalDateString,
  parseServerDate,
  toLocalDateString,
} from "@/utils/date";

afterEach(() => {
  vi.useRealTimers();
});

describe("parseServerDate", () => {
  it("reads a zone-less backend timestamp as UTC", () => {
    expect(parseServerDate("2026-10-12T22:30:00").toISOString()).toBe(
      "2026-10-12T22:30:00.000Z",
    );
    expect(parseServerDate("2026-10-12 22:30").toISOString()).toBe(
      "2026-10-12T22:30:00.000Z",
    );
  });

  it("keeps an explicit offset as written", () => {
    expect(parseServerDate("2026-10-12T22:30:00+02:00").toISOString()).toBe(
      "2026-10-12T20:30:00.000Z",
    );
  });

  it("passes epoch millis and Dates through", () => {
    expect(parseServerDate(0).getTime()).toBe(0);
    expect(parseServerDate(new Date(5)).getTime()).toBe(5);
  });
});

describe("local date strings", () => {
  it("round-trips without drifting a day", () => {
    const date = fromLocalDateString("2026-03-29");

    expect(toLocalDateString(date)).toBe("2026-03-29");
  });
});

describe("buildDateWindow", () => {
  it("ends today and never reaches before the earliest day", () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 13, 12) });

    expect(buildDateWindow(3, "2026-10-01")).toEqual([
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
    ]);
    expect(buildDateWindow(30, "2026-10-12")).toEqual([
      "2026-10-12",
      "2026-10-13",
    ]);
    expect(buildDateWindow(-1, "2026-10-10")).toHaveLength(4);
  });

  it("is empty when the earliest day is in the future", () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 13, 12) });

    expect(buildDateWindow(7, "2026-10-20")).toEqual([]);
  });
});

describe("formatRelativeTime", () => {
  it("picks the largest whole unit in the reader's language", () => {
    vi.useFakeTimers({ now: new Date("2026-10-13T12:00:00Z") });

    expect(formatRelativeTime(new Date("2026-10-12T12:00:00Z"), "hr")).toBe(
      "jučer",
    );
    expect(formatRelativeTime(Date.now() - 3 * 3_600_000, "en")).toBe(
      "3 hours ago",
    );
  });
});
