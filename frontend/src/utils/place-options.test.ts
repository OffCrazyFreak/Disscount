import { describe, expect, it } from "vitest";

import {
  listPlaceOptions,
  readPlaceName,
  toPinnedPlaces,
} from "@/utils/place-options";

const STORES = [
  { city: "Sveta Nedelja", zipcode: "10431" },
  { city: "Sveta Nedelja", zipcode: "52466" },
  { city: "Split", zipcode: "21000" },
  { city: "Split", zipcode: null },
];

describe("listPlaceOptions", () => {
  it("splits a name shared across counties, keyed with the county", () => {
    expect(listPlaceOptions(["Split", "Sveta Nedelja"], STORES, [])).toEqual([
      { key: "Split", name: "Split", county: null },
      {
        key: "Sveta Nedelja|zagrebCounty",
        name: "Sveta Nedelja",
        county: "zagrebCounty",
      },
      {
        key: "Sveta Nedelja|istria",
        name: "Sveta Nedelja",
        county: "istria",
      },
    ]);
  });

  it("splits namesakes that share postal area 10 but not a county", () => {
    expect(
      listPlaceOptions(
        ["Strmec"],
        [
          { city: "Strmec", zipcode: "10430" },
          { city: "Strmec", zipcode: "10090" },
        ],
        [],
      ),
    ).toEqual([
      { key: "Strmec|cityOfZagreb", name: "Strmec", county: "cityOfZagreb" },
      { key: "Strmec|zagrebCounty", name: "Strmec", county: "zagrebCounty" },
    ]);
  });

  it("shows a place saved under its old postal area as the option it names", () => {
    expect(
      listPlaceOptions(["Sveta Nedelja"], STORES, ["Sveta Nedelja|52"]),
    ).toEqual([
      {
        key: "Sveta Nedelja|zagrebCounty",
        name: "Sveta Nedelja",
        county: "zagrebCounty",
      },
      { key: "Sveta Nedelja|52", name: "Sveta Nedelja", county: "istria" },
    ]);
  });

  it("splits a name whose stores spell it differently in two postal areas", () => {
    expect(
      listPlaceOptions(
        ["Šenkovec"],
        [
          { city: "Senkovec", zipcode: "10000" },
          { city: "Šenkovec", zipcode: "40000" },
        ],
        [],
      ),
    ).toEqual([
      {
        key: "Šenkovec|cityOfZagreb",
        name: "Šenkovec",
        county: "cityOfZagreb",
      },
      { key: "Šenkovec|medimurje", name: "Šenkovec", county: "medimurje" },
    ]);
  });

  it("shows an old area 10 key as the namesake with the lower postcode", () => {
    expect(
      listPlaceOptions(
        ["Strmec"],
        [
          { city: "Strmec", zipcode: "10430" },
          { city: "Strmec", zipcode: "10090" },
        ],
        ["Strmec|10"],
      ),
    ).toEqual([
      { key: "Strmec|10", name: "Strmec", county: "cityOfZagreb" },
      { key: "Strmec|zagrebCounty", name: "Strmec", county: "zagrebCounty" },
    ]);
  });

  it("counts a postcode missing from the GeoNames list as no postcode", () => {
    expect(
      listPlaceOptions(
        ["Umag"],
        [
          { city: "Umag", zipcode: "52470" },
          { city: "Umag", zipcode: "51470" },
        ],
        [],
      ),
    ).toEqual([{ key: "Umag", name: "Umag", county: null }]);
  });

  it("keeps offering a place saved before its name was split", () => {
    expect(
      listPlaceOptions(["Sveta Nedelja"], STORES, ["Sveta Nedelja"]),
    ).toContainEqual({
      key: "Sveta Nedelja",
      name: "Sveta Nedelja",
      county: null,
    });
  });
});

describe("readPlaceName", () => {
  it("drops the county or old postal area a namesake is saved with", () => {
    expect(readPlaceName("Sveta Nedelja|istria")).toBe("Sveta Nedelja");
    expect(readPlaceName("Sveta Nedelja|52")).toBe("Sveta Nedelja");
    expect(readPlaceName("Split")).toBe("Split");
  });
});

describe("toPinnedPlaces", () => {
  it("saves a picked namesake's county in the id and the plain name beside it", () => {
    const [, istria] = listPlaceOptions(["Sveta Nedelja"], STORES, []);

    expect(toPinnedPlaces([istria.key, "Split"])).toEqual([
      { placeApiId: "Sveta Nedelja|istria", placeName: "Sveta Nedelja" },
      { placeApiId: "Split", placeName: "Split" },
    ]);
  });
});
