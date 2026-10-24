import { describe, expect, it } from "vitest";

import {
  placedAddressesAgree,
  readPlacedAddress,
  townsAgree,
  withoutSharedPoints,
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

describe("withoutSharedPoints", () => {
  it("drops records that share a point with another address", () => {
    const a = { address: "Ivana Brnjika Slovaka 105", lat: 45.56, lon: 18.18 };
    const b = { address: "Ivana Brnjika Slovaka 37", lat: 45.56, lon: 18.18 };
    const c = { address: "Trg Ante Starčevića 10", lat: 45.68, lon: 18.4 };
    const d = { address: "Trg Ante Starčevića 10", lat: 45.68, lon: 18.4 };

    expect(withoutSharedPoints([a, b, c, d])).toEqual([c, d]);
  });
});
