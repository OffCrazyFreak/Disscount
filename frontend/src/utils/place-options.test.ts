import { describe, expect, it } from "vitest";

import {
  listPlaceOptions,
  readPlaceName,
  toPinnedPlaces,
} from "@/utils/place-options";

const STORES = [
  { city: "Sveta Nedelja", zipcode: "10431" },
  { city: "Sveta Nedelja", zipcode: "52231" },
  { city: "Split", zipcode: "21000" },
  { city: "Split", zipcode: null },
];

describe("listPlaceOptions", () => {
  it("splits a name shared across postal areas by county, keyed with the area", () => {
    expect(listPlaceOptions(["Split", "Sveta Nedelja"], STORES, [])).toEqual([
      { key: "Split", name: "Split", county: null },
      { key: "Sveta Nedelja|10", name: "Sveta Nedelja", county: "zagreb" },
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
      { key: "Šenkovec|10", name: "Šenkovec", county: "zagreb" },
      { key: "Šenkovec|40", name: "Šenkovec", county: "medimurje" },
    ]);
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
  it("drops the postal area a namesake is saved with", () => {
    expect(readPlaceName("Sveta Nedelja|52")).toBe("Sveta Nedelja");
    expect(readPlaceName("Split")).toBe("Split");
  });
});

describe("toPinnedPlaces", () => {
  it("saves a namesake's postal area in the id and the plain name beside it", () => {
    expect(toPinnedPlaces(["Sveta Nedelja|52", "Split"])).toEqual([
      { placeApiId: "Sveta Nedelja|52", placeName: "Sveta Nedelja" },
      { placeApiId: "Split", placeName: "Split" },
    ]);
  });
});
