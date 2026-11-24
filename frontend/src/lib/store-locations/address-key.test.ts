import { describe, expect, it } from "vitest";

import {
  addressesMatch,
  parseAddress,
} from "@/lib/store-locations/address-key";

describe("parseAddress", () => {
  it("reads no house number when a street named for a date ends in bb", () => {
    expect(parseAddress("Ulica 1. svibnja bb")).toEqual({
      tokens: ["svibnja"],
      number: null,
    });
    expect(parseAddress("Ulica 1 svibnja BB").number).toBeNull();
  });

  it("keeps the unit number of a bb street in the street name", () => {
    expect(parseAddress("143.Domobranske pukovnije bb")).toEqual({
      tokens: ["143", "domobranske", "pukovnije"],
      number: null,
    });
    expect(parseAddress("Ulica 4. gardijske brigade bb").number).toBeNull();
  });

  it("still reads the house number after a street named for a date", () => {
    expect(parseAddress("Ulica 1. svibnja 12")).toEqual({
      tokens: ["svibnja"],
      number: "12",
    });
    expect(parseAddress("143.Domobranske pukovnije 4")).toEqual({
      tokens: ["143", "domobranske", "pukovnije"],
      number: "4",
    });
  });

  it("reads plain, lettered and zero house numbers as before", () => {
    expect(parseAddress("Ilica 10")).toEqual({
      tokens: ["ilica"],
      number: "10",
    });
    expect(parseAddress("Savska cesta 120/A").number).toBe("120a");
    expect(parseAddress("DRAVSKA 25 B").number).toBe("25b");
    expect(parseAddress("Lazina bb").number).toBeNull();
    expect(parseAddress("Prnjavor 0").number).toBeNull();
  });
});

describe("addressesMatch", () => {
  it("does not match a bb store to house 1 of a street named for a date", () => {
    expect(
      addressesMatch(
        parseAddress("Ulica 1. svibnja bb"),
        parseAddress("Ulica 1. svibnja 1"),
      ),
    ).toBe(false);
  });
});
