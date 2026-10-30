import { describe, expect, it } from "vitest";

import {
  geoapifyQuery,
  pickGeoapifyResult,
  type IGeoapifyResult,
} from "@/lib/store-locations/geocoders/geoapify-query";

describe("geoapifyQuery", () => {
  it("searches with upstream's address and town as they are", () => {
    expect(geoapifyQuery("Modrcinski put 19", "Kraljevica")).toEqual({
      text: "Modrcinski put 19, Kraljevica, Hrvatska",
      houseNumbers: ["19"],
    });
  });

  it("has no house number to expect for bb", () => {
    expect(geoapifyQuery("Lazina bb", "Draganici").houseNumbers).toEqual([]);
    expect(
      geoapifyQuery("Ulica 1. svibnja bb", "Draganici").houseNumbers,
    ).toEqual([]);
  });

  it("expects either end of a house number range", () => {
    expect(
      geoapifyQuery("J.J.STROSSMAYERA 75-77", "Osijek").houseNumbers,
    ).toEqual(["75", "77"]);
  });
});

function result(
  housenumber: string,
  rank: IGeoapifyResult["rank"],
  result_type = "building",
): IGeoapifyResult {
  return { lat: 45.4, lon: 15.5, housenumber, rank, result_type };
}

describe("pickGeoapifyResult", () => {
  it("takes the top result when it is the building asked for", () => {
    const store = result("19", { confidence: 1, confidence_building_level: 1 });

    expect(pickGeoapifyResult([store], ["19"])).toBe(store);
  });

  it("refuses a building matched only on its street", () => {
    const street = result("13", {
      confidence: 0.45,
      confidence_building_level: 0,
    });
    const school = result("37", {
      confidence: 0.73,
      confidence_building_level: 0.73,
    });

    expect(pickGeoapifyResult([street], ["13"])).toBeUndefined();
    expect(pickGeoapifyResult([school], ["37"])).toBeUndefined();
  });

  it("never looks past the top result", () => {
    const top = result("27", {
      confidence: 0.9,
      confidence_building_level: 0.9,
    });
    const second = result("28a", {
      confidence: 0.9,
      confidence_building_level: 0.9,
    });

    expect(pickGeoapifyResult([top, second], ["28a"])).toBeUndefined();
  });

  it("refuses a street result and a different number", () => {
    const strong = { confidence: 1, confidence_building_level: 1 };

    expect(
      pickGeoapifyResult([result("19", strong, "street")], ["19"]),
    ).toBeUndefined();
    expect(pickGeoapifyResult([result("21", strong)], ["19"])).toBeUndefined();
  });

  it("takes a range Geoapify returns whole", () => {
    const store = result("75-77", {
      confidence: 0.9,
      confidence_building_level: 0.9,
    });

    expect(pickGeoapifyResult([store], ["75", "77"])).toBe(store);
  });

  it("refuses everything without a house number to compare", () => {
    expect(
      pickGeoapifyResult(
        [result("19", { confidence: 1, confidence_building_level: 1 })],
        [],
      ),
    ).toBeUndefined();
  });
});
