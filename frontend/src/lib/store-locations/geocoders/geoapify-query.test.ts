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

  it("spaces initials glued to the next word", () => {
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

  it("keeps upstream's town when the comma is followed by no place", () => {
    expect(geoapifyQuery("Ilica 10, bb", "Zagreb").text).toBe(
      "Ilica 10, bb, Zagreb, Hrvatska",
    );
  });

  it("has no house number to expect for bb", () => {
    expect(geoapifyQuery("Lazina bb", "Draganici").houseNumber).toBeNull();
    expect(
      geoapifyQuery("Ulica 1. svibnja bb", "Draganici").houseNumber,
    ).toBeNull();
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

  it("takes a lower-ranked building only on street and city confidence", () => {
    const street = result("4", { confidence: 0.9 }, "street");
    const otherStreet = result("4", {
      confidence: 0.7,
      confidence_street_level: 0.5,
      confidence_city_level: 1,
    });

    expect(pickGeoapifyResult([street, otherStreet], "4")).toBeUndefined();
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
