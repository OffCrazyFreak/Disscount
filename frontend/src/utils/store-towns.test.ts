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
  { city: "Sveta Nedelja", zipcode: "52466", lat: 45.06, lon: 14.06 },
  { city: "Sveta Nedelja", zipcode: null, lat: 45, lon: 15 },
];

const STRMEC = [
  { city: "Strmec", zipcode: "10090", lat: 45.81, lon: 15.86 },
  { city: "Strmec", zipcode: "10430", lat: 45.8, lon: 15.7 },
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
        key: "Sveta Nedelja|zagrebCounty",
        name: "Sveta Nedelja",
        county: "zagrebCounty",
        zipcodes: ["10431"],
      },
      {
        key: "Sveta Nedelja|istria",
        name: "Sveta Nedelja",
        county: "istria",
        zipcodes: ["52466"],
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

  it("counts a postcode missing from the GeoNames list as no postcode", () => {
    expect(
      listStoreTowns([
        { city: "Umag", zipcode: "52470", lat: 45.43, lon: 13.52 },
        { city: "Umag", zipcode: "51470", lat: 45.42, lon: 13.53 },
        { city: "Umag", zipcode: null, lat: 45.44, lon: 13.54 },
      ]),
    ).toEqual([
      {
        key: "Umag",
        name: "Umag",
        county: null,
        zipcodes: ["51470", "52470"],
      },
    ]);
    expect(
      townCenter(
        [
          { city: "Umag", zipcode: "52470", lat: 45.43, lon: 13.52 },
          { city: "Umag", zipcode: "51470", lat: 45.42, lon: 13.53 },
          { city: "Umag", zipcode: null, lat: 45.44, lon: 13.54 },
        ],
        "Umag",
      ),
    ).toMatchObject({ lat: expect.closeTo(45.43) });
  });

  it("keeps apart namesakes in one postal area but two counties", () => {
    expect(listStoreTowns(STRMEC).map((town) => town.key)).toEqual([
      "Strmec|cityOfZagreb",
      "Strmec|zagrebCounty",
    ]);
  });

  it("names the exact county of each postcode, the City of Zagreb included", () => {
    expect(
      listStoreTowns([
        { city: "Brezovica", zipcode: "10257", lat: 45.73, lon: 15.91 },
        { city: "Brezovica", zipcode: "31540", lat: 45.62, lon: 18.03 },
      ]).map((town) => town.county),
    ).toEqual(["cityOfZagreb", "osijekBaranja"]);
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

  it("merges spellings that differ only in accents or case, keeping the accents", () => {
    expect(
      listStoreTowns([
        { city: "Plaski", zipcode: "47304", lat: 45.08, lon: 15.36 },
        { city: "Plaški", zipcode: "47304", lat: 45.08, lon: 15.36 },
        { city: "PLAŠKI", zipcode: null, lat: 45.08, lon: 15.36 },
        { city: "Plaški", zipcode: "47304", lat: 45.08, lon: 15.36 },
      ]),
    ).toEqual([
      { key: "Plaški", name: "Plaški", county: null, zipcodes: ["47304"] },
    ]);
  });

  it("prefers a spelling in normal case over one in capitals", () => {
    expect(
      listStoreTowns([
        { city: "ŠIBENIK", zipcode: "22000", lat: 43.73, lon: 15.89 },
        { city: "ŠIBENIK", zipcode: "22000", lat: 43.73, lon: 15.89 },
        { city: "Šibenik", zipcode: "22000", lat: 43.73, lon: 15.89 },
      ]),
    ).toMatchObject([{ name: "Šibenik" }]);
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
    expect(townCenter(NAMESAKES, "Sveta Nedelja|istria")).toEqual({
      lat: 45.06,
      lon: 14.06,
      name: "Sveta Nedelja",
      county: "istria",
    });
  });

  it("still finds a namesake saved under its old postal area", () => {
    expect(townCenter(NAMESAKES, "Sveta Nedelja|52")).toMatchObject({
      lat: 45.06,
      county: "istria",
    });
    expect(townCenter(NAMESAKES, "Sveta Nedelja|10")).toMatchObject({
      lat: 45.8,
      county: "zagrebCounty",
    });
  });

  it("reads an old area 10 key as the lower postcode when both Zagreb counties share the name", () => {
    expect(townCenter(STRMEC, "Strmec|10")).toMatchObject({
      lat: 45.81,
      county: "cityOfZagreb",
    });
  });

  it("places a bare shared name, as an older saved place has, at the lowest postal area", () => {
    expect(townCenter(NAMESAKES, "Sveta Nedelja")).toMatchObject({
      lat: 45.8,
      county: "zagrebCounty",
    });
  });

  it("finds a saved namesake by its folded name once it no longer clashes", () => {
    expect(townCenter(STORES, "split|21")).toMatchObject({ name: "Split" });
  });
});
