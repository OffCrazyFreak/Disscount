import { describe, expect, it } from "vitest";

import {
  openFilterOf,
  openParamOf,
  passesOpenFilter,
} from "@/app/[locale]/map/utils/open-filter";
import type { OpeningStatus } from "@/lib/store-hours/opening-status";

const AS_OF = "2026-11-02T06:00:00.000Z";
const open: OpeningStatus = { state: "open", closesAt: null, asOf: AS_OF };
const closingSoon: OpeningStatus = { ...open, state: "closing-soon" };
const closed: OpeningStatus = { state: "closed", opensAt: null, asOf: AS_OF };
const openingSoon: OpeningStatus = { ...closed, state: "opening-soon" };
const unconfirmed: OpeningStatus = { state: "unconfirmed", asOf: null };

describe("passesOpenFilter", () => {
  it("keeps every store while off", () => {
    for (const status of [open, closed, unconfirmed]) {
      expect(passesOpenFilter(status, "off")).toBe(true);
    }
  });

  it("keeps only confirmed open stores by default", () => {
    expect(passesOpenFilter(open, "confirmed")).toBe(true);
    expect(passesOpenFilter(closingSoon, "confirmed")).toBe(true);
    expect(passesOpenFilter(closed, "confirmed")).toBe(false);
    expect(passesOpenFilter(openingSoon, "confirmed")).toBe(false);
    expect(passesOpenFilter(unconfirmed, "confirmed")).toBe(false);
  });

  it("adds unconfirmed stores with the second switch, never closed ones", () => {
    expect(passesOpenFilter(unconfirmed, "with-unconfirmed")).toBe(true);
    expect(passesOpenFilter(closed, "with-unconfirmed")).toBe(false);
  });
});

describe("the open URL parameter", () => {
  it("round-trips every filter", () => {
    for (const filter of ["off", "confirmed", "with-unconfirmed"] as const) {
      expect(openFilterOf(openParamOf(filter))).toBe(filter);
    }
  });

  it("reads an unknown value as off", () => {
    expect(openFilterOf("yes")).toBe("off");
  });
});
