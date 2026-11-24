import { describe, expect, it } from "vitest";

import {
  stanicCodeFor,
  stanicCodeReader,
} from "@/lib/store-locations/sources/stanic-store-codes";

describe("stanicCodeFor", () => {
  it("reads diskont.hr titles with their HTML entities and spacing", () => {
    expect(stanicCodeFor("Diskont Stanić Zagreb &#8211;  Žitnjak")).toBe("131");
    expect(stanicCodeFor("Diskont Stanić Zagreb &#8211; Veletržnica")).toBe(
      "133",
    );
    expect(stanicCodeFor("Diskont Stanić Kaštel Gomilica")).toBe("8307");
  });

  it("tells the two Pula stores apart by their number", () => {
    expect(stanicCodeFor("Diskont Stanić Pula")).toBe("734");
    expect(stanicCodeFor("Diskont Stanić Pula 2")).toBe("739");
  });

  it("does not read a numbered second store as the first one", () => {
    expect(stanicCodeFor("Diskont Stanić Zadar 2")).toBeUndefined();
  });

  it("knows nothing about a store it has never seen", () => {
    expect(stanicCodeFor("Diskont Stanić Osijek")).toBeUndefined();
  });
});

describe("stanicCodeReader", () => {
  it("drops a code two rows share, even when one twin is unusable", () => {
    const codeFor = stanicCodeReader([
      { store: "Diskont Stanić Zadar", address: "Put Murvice 79", lat: "44.1" },
      { store: "Diskont Stanić Zadar", lat: "" },
      { store: "Diskont Stanić Vodice" },
      "not a store",
    ]);

    expect(codeFor("Diskont Stanić Zadar")).toBeUndefined();
    expect(codeFor("Diskont Stanić Vodice")).toBe("932");
  });
});
