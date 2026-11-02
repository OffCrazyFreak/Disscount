import { describe, expect, it } from "vitest";

import { listStoreTowns, townCenter } from "@/utils/store-towns";

const STORES = [
  { city: "Split", zipcode: "21000", lat: 43.5, lon: 16.4 },
  { city: " Split ", zipcode: "21000", lat: 43.52, lon: 16.48 },
  { city: "Čakovec", zipcode: "40000", lat: 46.38, lon: 16.43 },
  { city: "Bjelovar", zipcode: "43000", lat: null, lon: null },
  { city: null, zipcode: null, lat: 45, lon: 15 },
];

describe("listStoreTowns", () => {
  it("lists each town with a located store once, in Croatian order", () => {
    expect(listStoreTowns(STORES)).toEqual([
      { name: "Čakovec", zipcodes: ["40000"] },
      { name: "Split", zipcodes: ["21000"] },
    ]);
  });
});

describe("townCenter", () => {
  it("averages the town's located stores", () => {
    expect(townCenter(STORES, "Split")).toEqual({
      lat: expect.closeTo(43.51),
      lon: expect.closeTo(16.44),
    });
  });

  it("knows no centre for a town without located stores", () => {
    expect(townCenter(STORES, "Bjelovar")).toBeNull();
  });
});
