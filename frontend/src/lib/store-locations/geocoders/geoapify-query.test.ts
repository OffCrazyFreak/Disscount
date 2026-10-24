import { describe, expect, it } from "vitest";

import {
  geoapifyQuery,
  pickGeoapifyResult,
  type IGeoapifyResult,
} from "@/lib/store-locations/geocoders/geoapify-query";

describe("geoapifyQuery", () => {
  it("separates a house number glued to the street", () => {
    expect(geoapifyQuery("Ulica Svetog Nikole16A", "Solin")).toEqual({
      text: "Ulica Svetog Nikole 16A, Solin, Hrvatska",
      houseNumber: "16a",
    });
  });

  it("spells out common abbreviations and spaces initials", () => {
    expect(geoapifyQuery("Ul. Matije Gupca 4", "Osijek").text).toBe(
      "Ulica Matije Gupca 4, Osijek, Hrvatska",
    );
    expect(geoapifyQuery("Trg dr.Franje Tudmana 1", "Recica").text).toBe(
      "Trg dr. Franje Tudmana 1, Recica, Hrvatska",
    );
  });

  it("searches in the village written after the number", () => {
    expect(
      geoapifyQuery("I.B.SLOVAKA 105, Jelisavac", "Breznica Nasicka"),
    ).toEqual({
      text: "I. B. SLOVAKA 105, Jelisavac, Hrvatska",
      houseNumber: "105",
    });
  });

  it("has no house number to expect for bb", () => {
    expect(geoapifyQuery("Lazina bb", "Draganici").houseNumber).toBeNull();
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
  it("takes the right building ranked second on street and city confidence", () => {
    const school = result("27", { confidence: 0.9 });
    const store = result("28a", {
      confidence: 0.4,
      confidence_street_level: 0.9,
      confidence_city_level: 1,
    });

    expect(pickGeoapifyResult([school, store], "28a")).toBe(store);
  });

  it("still takes a building on overall confidence alone", () => {
    const store = result("19", { confidence: 0.7 });

    expect(pickGeoapifyResult([store], "19")).toBe(store);
  });

  it("refuses a doubtful building, a street and a different number", () => {
    const doubtful = result("19", {
      confidence: 0.5,
      confidence_street_level: 0.9,
      confidence_city_level: 0.5,
    });
    const street = result("19", { confidence: 1 }, "street");
    const neighbour = result("21", { confidence: 1 });

    expect(
      pickGeoapifyResult([doubtful, street, neighbour], "19"),
    ).toBeUndefined();
  });

  it("refuses everything without a house number to compare", () => {
    expect(
      pickGeoapifyResult([result("19", { confidence: 1 })], null),
    ).toBeUndefined();
  });
});
