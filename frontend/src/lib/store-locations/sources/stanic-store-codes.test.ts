import { describe, expect, it } from "vitest";

import {
  dropSharedCodes,
  stanicCodeFor,
} from "@/lib/store-locations/sources/stanic-store-codes";
import { matchLocatorStore } from "@/lib/store-locations/sync/match-locator-store";
import type { ISyncTarget } from "@/lib/store-locations/sync/sync-target";

function target(code: string, city: string | null): ISyncTarget {
  return {
    chain: "stanic",
    code,
    address: null,
    city,
    zipcode: null,
    skipGeoapify: false,
  };
}

function record(title: string, city: string) {
  return {
    code: stanicCodeFor(title),
    address: "Ulica 1",
    city,
    lat: 45.8,
    lon: 16,
  };
}

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

describe("dropSharedCodes", () => {
  it("drops a code two stores would share", () => {
    const stores = [{ code: "933" }, { code: "933" }, { code: "932" }];

    expect(dropSharedCodes(stores)).toEqual([
      { code: undefined },
      { code: undefined },
      { code: "932" },
    ]);
  });
});

describe("Stanić matching", () => {
  const zitnjak = record("Diskont Stanić Zagreb &#8211; Žitnjak", "Zagreb");
  const pula = record("Diskont Stanić Pula", "Pula");
  const osijek = record("Diskont Stanić Osijek", "Osijek");

  it("places a store by its code", () => {
    expect(matchLocatorStore(target("131", "Zagreb"), [zitnjak, pula])).toBe(
      zitnjak,
    );
  });

  it("leaves an unknown code unplaced, even in a town with one store", () => {
    expect(
      matchLocatorStore(target("531", "Osijek"), [zitnjak, osijek]),
    ).toBeNull();
    expect(matchLocatorStore(target("1301", null), [zitnjak, pula])).toBeNull();
  });
});
