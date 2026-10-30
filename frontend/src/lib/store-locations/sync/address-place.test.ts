import { describe, expect, it } from "vitest";

import {
  placedAddressesAgree,
  readPlacedAddress,
  townsAgree,
} from "@/lib/store-locations/sync/address-place";

describe("readPlacedAddress", () => {
  it("takes the village after a comma out of the street", () => {
    expect(readPlacedAddress("B. RADICA 9, Ladimirevci")).toMatchObject({
      tokens: ["radica"],
      number: "9",
      places: ["ladimirevci"],
    });
  });

  it("takes the village after the house number out of the street", () => {
    expect(readPlacedAddress("Ul. Matije Gupca 6 Sladojevci")).toMatchObject({
      tokens: ["matije", "gupca"],
      number: "6",
      places: ["sladojevci"],
    });
  });

  it("keeps a house letter as part of the number", () => {
    expect(readPlacedAddress("DRAVSKA 25 B")).toMatchObject({
      number: "25b",
      places: [],
    });
  });

  it("does not read the street of a number-first address as a village", () => {
    expect(readPlacedAddress("143.Domobranske pukovnije bb").places).toEqual(
      [],
    );
  });

  it("does not read bb after a comma as a village", () => {
    expect(readPlacedAddress("Kralja Tomislava, bb").places).toEqual([]);
  });

  it("does not split a street named after a date", () => {
    expect(readPlacedAddress("Ulica 1 svibnja bb").places).toEqual([]);
  });

  it("drops a note in brackets", () => {
    expect(readPlacedAddress("NAS. A.HEBRANGA 9 ( blok 2 )")).toMatchObject({
      number: "9",
    });
  });

  it("reads both ends of a house number range", () => {
    expect(readPlacedAddress("Ruzina ulica 63_71")).toMatchObject({
      number: "63",
      rangeEnd: "71",
    });
  });
});

describe("placedAddressesAgree", () => {
  function agree(a: string, b: string) {
    return placedAddressesAgree(readPlacedAddress(a), readPlacedAddress(b));
  }

  it("matches 0 and bb on both sides of the same street", () => {
    expect(agree("K.TOMISLAVA 0", "Ulica kralja Tomislava 0")).toBe(true);
    expect(agree("Prnjavor bb", "Prnjavor BB")).toBe(true);
  });

  it("matches a numberless street only when upstream says 0 or bb", () => {
    expect(agree("M.J.ZAGORKE BB", "Ul. Marije Jurić Zagorke")).toBe(true);
    expect(agree("Ilica", "Ilica bb")).toBe(false);
  });

  it("does not match a street without a number to a numbered one", () => {
    expect(agree("ZELJEZNICKA 0", "Željeznička ul. 10")).toBe(false);
  });

  it("reads a two-letter Croatian initial", () => {
    expect(agree("LJ.GAJA 5", "Ul. Ljudevita Gaja 5")).toBe(true);
  });

  it("accepts either end of a range", () => {
    expect(agree("J.J.STROSSMAYERA 75-77", "J. J. Strossmayera 77")).toBe(true);
    expect(agree("J.J.STROSSMAYERA 75-77", "J. J. Strossmayera 76")).toBe(
      false,
    );
  });

  it("does not take a range that merely touches another", () => {
    expect(agree("Vukovarska 75-77", "Vukovarska 77-79")).toBe(false);
  });
});

describe("townsAgree", () => {
  it("accepts a shared town, written either way round", () => {
    expect(townsAgree(["podgorac", "suboticki lug"], ["lug suboticki"])).toBe(
      true,
    );
  });

  it("does not take a town merely containing the other's letters", () => {
    expect(townsAgree(["rab"], ["rabac"])).toBe(false);
  });
});
