import { describe, expect, it } from "vitest";

import {
  compactStoreHoursResponse,
  type StoreHoursDto,
  type StoreHoursResponse,
} from "@/lib/api/schemas";
import {
  decodeStoreHours,
  encodeStoreHours,
} from "@/lib/store-hours/compact-store-hours";

const VERIFIED = "2026-11-02T06:00:00.000Z";
const LATER = "2026-11-03T06:00:00.000Z";

const day = [{ opens: "07:00", closes: "21:00" }];
const split = [
  { opens: "07:00", closes: "13:00" },
  { opens: "16:00", closes: "02:00" },
];

const plainStore: StoreHoursDto = {
  weekly: [day, day, day, day, day, day, []],
  dated: [],
  sundays: "dated",
  source: "chain",
  verifiedAt: VERIFIED,
  checkUrl: "https://example.com/finder",
};

const response: StoreHoursResponse = {
  stores: {
    "konzum:1": plainStore,
    "konzum:2": plainStore,
    "lidl:1": {
      weekly: [split, null, null, day, day, day, null],
      dated: [
        // One before the base date, one past the DST change.
        { date: "2026-11-01", ranges: [], verifiedAt: VERIFIED },
        { date: "2027-03-29", ranges: day, verifiedAt: LATER },
      ],
      sundays: "weekly",
      source: "osm",
      verifiedAt: LATER,
      checkUrl: null,
    },
  },
  holidays: ["2026-11-18"],
  generatedAt: "2026-11-03T22:30:00.000Z",
};

// What the browser receives has been through JSON.
function overTheWire(hours: StoreHoursResponse) {
  return JSON.parse(JSON.stringify(encodeStoreHours(hours)));
}

describe("compact store hours", () => {
  it("decodes to exactly what was encoded", () => {
    const decoded = decodeStoreHours(
      compactStoreHoursResponse.parse(overTheWire(response)),
    );

    expect(decoded).toStrictEqual(response);
  });

  it("round trips an empty response", () => {
    const empty = { stores: {}, holidays: [], generatedAt: VERIFIED };

    expect(
      decodeStoreHours(compactStoreHoursResponse.parse(overTheWire(empty))),
    ).toStrictEqual(empty);
  });

  it("keeps what stores share only once", () => {
    const compact = encodeStoreHours(response);

    expect(compact.weeklyTemplates).toHaveLength(2);
    expect(compact.datedLists).toHaveLength(2);
    expect(compact.verifiedTimes).toEqual([VERIFIED, LATER]);
    expect(compact.checkUrls).toEqual(["https://example.com/finder"]);
    expect(compact.stores["konzum:1"]).toEqual(compact.stores["konzum:2"]);
  });

  it("counts dates from Zagreb's day, not UTC's", () => {
    // 23:30 UTC on the 3rd is already the 4th in Zagreb.
    const compact = encodeStoreHours({
      ...response,
      generatedAt: "2026-11-03T23:30:00.000Z",
    });

    expect(compact.baseDate).toBe("2026-11-04");
  });

  it.each([
    ["weekly template", 0, 99],
    ["dated list", 1, 99],
    ["verified time", 2, 99],
    ["check URL", 3, 99],
  ])("refuses a store pointing past the %s table", (_name, slot, index) => {
    const wire = overTheWire(response);

    wire.stores["konzum:1"][slot] = index;

    expect(compactStoreHoursResponse.safeParse(wire).success).toBe(false);
  });

  it("refuses a dated entry pointing past the verified times", () => {
    const wire = overTheWire(response);

    wire.datedLists[1][0][2] = 99;

    expect(compactStoreHoursResponse.safeParse(wire).success).toBe(false);
  });

  it("still refuses a range that opens and closes at the same time", () => {
    const wire = overTheWire(response);

    wire.weeklyTemplates[0][0] = [{ opens: "00:00", closes: "00:00" }];

    expect(compactStoreHoursResponse.safeParse(wire).success).toBe(false);
  });
});
