import { describe, expect, it, vi } from "vitest";

import type { storeHours, storeHoursOverlay } from "@/db/store-hours-schema";

vi.mock("server-only", () => ({}));

const { buildStoreHours, hoursWindow } =
  await import("@/lib/store-hours/build-store-hours");
const { HOURS_CHAINS } = await import("@/lib/store-hours/hours-chains");

type Row = typeof storeHours.$inferSelect;
type Overlay = typeof storeHoursOverlay.$inferSelect;

const verifiedAt = new Date("2026-11-02T06:00:00Z");
const announcedAt = new Date("2026-11-05T06:00:00Z");
const open = [{ opens: "07:00", closes: "21:00" }];
const window = hoursWindow(new Date("2026-11-04T10:00:00Z"));

function row(overrides: Partial<Row> = {}): Row {
  return {
    chainCode: "konzum",
    storeCode: "101",
    weekly: [open, open, open, open, open, open, []],
    exceptions: [],
    sundays: "dated",
    source: "chain",
    checkUrl: "https://example.hr/store/101",
    verifiedAt,
    linkStatus: "ok",
    linkCheckedAt: verifiedAt,
    linkFailures: 0,
    ...overrides,
  };
}

function overlay(overrides: Partial<Overlay>): Overlay {
  return {
    chainCode: "konzum",
    storeCode: "101",
    date: "2026-11-08",
    ranges: open,
    source: "chain",
    verifiedAt: announcedAt,
    ...overrides,
  };
}

describe("buildStoreHours", () => {
  it("layers the store's exception over its announcement over the chain's", () => {
    const stores = buildStoreHours(
      [row({ exceptions: [{ date: "2026-11-08", ranges: [] }] })],
      [
        overlay({}),
        overlay({ storeCode: "", date: "2026-11-15", ranges: [] }),
        overlay({ date: "2026-11-15" }),
        overlay({ storeCode: "", date: "2026-11-22", ranges: [] }),
      ],
      window,
    );

    expect(stores["konzum:101"].dated).toStrictEqual([
      { date: "2026-11-08", ranges: [], verifiedAt: verifiedAt.toISOString() },
      {
        date: "2026-11-15",
        ranges: open,
        verifiedAt: announcedAt.toISOString(),
      },
      { date: "2026-11-22", ranges: [], verifiedAt: announcedAt.toISOString() },
    ]);
  });

  it("drops dated entries outside the window", () => {
    const stores = buildStoreHours(
      [row({ exceptions: [{ date: "2026-10-01", ranges: [] }] })],
      [overlay({ date: "2027-03-01" })],
      window,
    );

    expect(stores["konzum:101"].dated).toStrictEqual([]);
  });

  it("falls back to the chain's finder for a dead store page", () => {
    const stores = buildStoreHours(
      [
        row({ linkStatus: "broken" }),
        row({ storeCode: "102", linkStatus: "unverified" }),
        row({ storeCode: "103", checkUrl: null }),
      ],
      [],
      window,
    );

    expect(stores["konzum:101"].checkUrl).toBe(HOURS_CHAINS.konzum.finderUrl);
    expect(stores["konzum:102"].checkUrl).toBe("https://example.hr/store/101");
    expect(stores["konzum:103"].checkUrl).toBe(HOURS_CHAINS.konzum.finderUrl);
  });

  it("hides a chain whose switch is off but keeps its OpenStreetMap hours", () => {
    const original = HOURS_CHAINS.konzum;
    HOURS_CHAINS.konzum = { ...original, enabled: false };

    try {
      const stores = buildStoreHours(
        [row(), row({ storeCode: "102", source: "osm" })],
        [],
        window,
      );

      expect(Object.keys(stores)).toStrictEqual(["konzum:102"]);
    } finally {
      HOURS_CHAINS.konzum = original;
    }
  });
});
