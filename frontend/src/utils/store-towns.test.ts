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
      { name: "Čakovec", label: "Čakovec", zipcodes: ["40000"] },
      { name: "Split", label: "Split", zipcodes: ["21000"] },
    ]);
  });

  it("keeps apart towns that share a name in different postal areas", () => {
    expect(listStoreTowns(NAMESAKES)).toEqual([
      {
        name: "Sveta Nedelja",
        label: "Sveta Nedelja (10431)",
        zipcodes: ["10431"],
      },
      {
        name: "Sveta Nedelja",
        label: "Sveta Nedelja (52231)",
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
    ).toContainEqual({ name: "Split", label: "Split", zipcodes: ["21000"] });
  });
});

describe("townCenter", () => {
  it("averages the town's located stores", () => {
    expect(townCenter(STORES, "Split")).toEqual({
      lat: expect.closeTo(43.51),
      lon: expect.closeTo(16.44),
      label: "Split",
    });
  });

  it("measures each namesake from its own stores", () => {
    expect(townCenter(NAMESAKES, "Sveta Nedelja (52231)")).toEqual({
      lat: 45.06,
      lon: 14.06,
      label: "Sveta Nedelja (52231)",
    });
  });

  it("places a bare shared name, as a saved place has, at the lowest postcode", () => {
    expect(townCenter(NAMESAKES, "Sveta Nedelja")).toMatchObject({
      label: "Sveta Nedelja (10431)",
    });
  });

  it("knows no centre for a town without located stores", () => {
    expect(townCenter(STORES, "Bjelovar")).toBeNull();
  });
});
