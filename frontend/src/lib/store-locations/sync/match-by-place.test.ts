import { describe, expect, it } from "vitest";

import { matchLocatorStore } from "@/lib/store-locations/sync/match-locator-store";
import type { ILocatorStore } from "@/lib/store-locations/types";
import type { ISyncTarget } from "@/lib/store-locations/sync/sync-target";

function target(code: string, address: string, city: string): ISyncTarget {
  return {
    chain: "ntl",
    code,
    address,
    city,
    zipcode: null,
    skipGeoapify: false,
  };
}

let nextLat = 45;

function record(
  address: string,
  city: string,
  codeSuffix?: string,
): ILocatorStore {
  return { address, city, codeSuffix, lat: (nextLat += 0.01), lon: 18 };
}

describe("matching by village", () => {
  it("finds the village a source writes after the comma", () => {
    const lada = record("B. Radića 9", "Ladimirevci");

    expect(
      matchLocatorStore(
        target("20218", "B. RADICA 9, Ladimirevci", "Valpovo"),
        [lada],
      ),
    ).toBe(lada);
  });

  it("matches a numberless street only in the same town", () => {
    const cepin = record("Ulica kralja Tomislava 0", "Čepin");
    const belisce = record("Kralja Tomislava 0", "Vinogradci");

    expect(
      matchLocatorStore(target("20202", "K.TOMISLAVA 0", "Čepin"), [
        belisce,
        cepin,
      ]),
    ).toBe(cepin);
    expect(
      matchLocatorStore(target("20202", "K.TOMISLAVA 0", "Osijek"), [
        belisce,
        cepin,
      ]),
    ).toBeNull();
  });

  it("refuses another village of the same municipality", () => {
    const zelcin = record("Kralja Tomislava 0, Zelčin", "Valpovo");

    expect(
      matchLocatorStore(
        target("20999", "K.TOMISLAVA 0, Ladimirevci", "Valpovo"),
        [zelcin],
      ),
    ).toBeNull();
  });

  it("refuses when two records fit", () => {
    const one = record("Ljudevita Gaja 5", "Osijek");
    const two = record("Trg Ljudevita Gaja 5", "Osijek");

    expect(
      matchLocatorStore(target("20219", "LJ.GAJA 5", "Osijek"), [one, two]),
    ).toBeNull();
  });
});

describe("matching by store number", () => {
  const svetaAna = record("Ul. Svete Ane 83", "Osijek", "0364");

  it("accepts the numbered record when the town agrees", () => {
    expect(
      matchLocatorStore(target("20364", "Anina 83, Osijek", "Osijek"), [
        svetaAna,
      ]),
    ).toBe(svetaAna);
  });

  it("accepts it when the address agrees but the town does not", () => {
    const sigetec = record("Ul. Braće Radić 25", "Sigetec", "2100");

    expect(
      matchLocatorStore(target("32100", "Ulica Brace Radica 25", "Delekovec"), [
        sigetec,
      ]),
    ).toBe(sigetec);
  });

  it("refuses when neither the address nor the town agrees", () => {
    expect(
      matchLocatorStore(target("20364", "Vukovarska 1", "Vinkovci"), [
        svetaAna,
      ]),
    ).toBeNull();
  });

  it("needs the whole number, not a shorter one at the end of the code", () => {
    const forty = record("Krapinska ulica 6", "Vidovec", "0040");

    expect(
      matchLocatorStore(target("31040", "Varazdinska BB", "Vidovec"), [forty]),
    ).toBeNull();
  });

  it("refuses a number that another upstream code also ends in", () => {
    expect(
      matchLocatorStore(
        target("20364", "Anina 83, Osijek", "Osijek"),
        [svetaAna],
        ["20364", "30364"],
      ),
    ).toBeNull();
  });

  it("refuses when two records carry the number", () => {
    const twin = record("Ul. Svete Ane 83", "Osijek", "0364");

    expect(
      matchLocatorStore(target("20364", "Anina 83, Osijek", "Osijek"), [
        svetaAna,
        twin,
      ]),
    ).toBeNull();
  });
});
