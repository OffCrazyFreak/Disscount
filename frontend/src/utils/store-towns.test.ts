import { describe, expect, it } from "vitest";

import { listStoreTowns, townCenter } from "@/utils/store-towns";

const STORES = [
  { city: "Split", zipcode: "21000", lat: 43.5, lon: 16.4 },
  { city: " Split ", zipcode: "21000", lat: 43.52, lon: 16.48 },
  { city: "Čakovec", zipcode: "40000", lat: 46.38, lon: 16.43 },
  { city: "Bjelovar", zipcode: "43000", lat: null, lon: null },
  { city: null, zipcode: null, lat: 45, lon: 15 },
];

const NAMESAKES = [
  { city: "Sveta Nedelja", zipcode: "10431", lat: 45.8, lon: 15.78 },
  { city: "Sveta Nedelja", zipcode: "52231", lat: 45.06, lon: 14.06 },
  { city: "Sveta Nedelja", zipcode: null, lat: 45, lon: 15 },
];

describe("listStoreTowns", () => {
  it("lists each town with a located store once, in Croatian order", () => {
    expect(listStoreTowns(STORES)).toEqual([
      { key: "Čakovec", name: "Čakovec", county: null, zipcodes: ["40000"] },
      { key: "Split", name: "Split", county: null, zipcodes: ["21000"] },
    ]);
  });

  it("keeps apart towns that share a name, naming their counties", () => {
    expect(listStoreTowns(NAMESAKES)).toEqual([
      {
        key: "Sveta Nedelja|10",
        name: "Sveta Nedelja",
        county: "zagreb",
        zipcodes: ["10431"],
      },
      {
        key: "Sveta Nedelja|52",
        name: "Sveta Nedelja",
        county: "istria",
        zipcodes: ["52231"],
      },
    ]);
  });

  it("files a store without a postcode under its town's only postal area", () => {
    expect(
      listStoreTowns([
        ...STORES,
        { city: "Split", zipcode: null, lat: 43.5, lon: 16.5 },
      ]),
    ).toContainEqual({
      key: "Split",
      name: "Split",
      county: null,
      zipcodes: ["21000"],
    });
  });

  it("treats a postcode outside every postal area as missing", () => {
    expect(
      listStoreTowns([
        { city: "Umag", zipcode: "52470", lat: 45.43, lon: 13.52 },
        { city: "Umag", zipcode: "HR-52470", lat: 45.44, lon: 13.53 },
      ]),
    ).toEqual([
      {
        key: "Umag",
        name: "Umag",
        county: null,
        zipcodes: ["HR-52470", "52470"].sort(),
      },
    ]);
  });
});

describe("townCenter", () => {
  it("averages the town's located stores", () => {
    expect(townCenter(STORES, "Split")).toEqual({
      lat: expect.closeTo(43.51),
      lon: expect.closeTo(16.44),
      name: "Split",
      county: null,
    });
  });

  it("knows no centre for a town without located stores", () => {
    expect(townCenter(STORES, "Bjelovar")).toBeNull();
  });

  it("measures each namesake from its own stores", () => {
    expect(townCenter(NAMESAKES, "Sveta Nedelja|52")).toEqual({
      lat: 45.06,
      lon: 14.06,
      name: "Sveta Nedelja",
      county: "istria",
    });
  });

  it("places a bare shared name, as an older saved place has, at the lowest postal area", () => {
    expect(townCenter(NAMESAKES, "Sveta Nedelja")).toMatchObject({
      lat: 45.8,
      county: "zagreb",
    });
  });
});
