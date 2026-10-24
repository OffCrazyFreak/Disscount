import { describe, expect, it } from "vitest";

import {
  dropSharedCodes,
  stanicCodeFor,
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
