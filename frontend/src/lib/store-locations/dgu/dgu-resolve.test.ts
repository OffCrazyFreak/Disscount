import { describe, expect, it } from "vitest";

import { matchedOnlyByStem } from "@/lib/store-locations/address-key";
import { resolveCandidates } from "@/lib/store-locations/dgu/dgu-resolve";
import type { IDguCandidate } from "@/lib/store-locations/dgu/dgu-types";

const TOWN = 1;
const names = new Map([[TOWN, "velika gorica"]]);
const target = {
  id: "stridon:Prod.10",
  address: "Ljudevita Posavskog 23",
  city: "Velika Gorica",
};

function candidate(northing: number, exact: boolean): IDguCandidate {
  return { target: 0, northing, easting: 4_800_000, refs: [TOWN], exact };
}

describe("matchedOnlyByStem", () => {
  it("flags a street that shares only the five-letter stem", () => {
    expect(matchedOnlyByStem(["ljudevita", "posavskog"], ["posavska"])).toBe(
      true,
    );
  });

  it("accepts the same word or a short form of it", () => {
    expect(matchedOnlyByStem(["posavskog"], ["ljudevita", "posavskog"])).toBe(
      false,
    );
    expect(matchedOnlyByStem(["set"], ["setaliste"])).toBe(false);
  });
});

describe("resolveCandidates", () => {
  it("prefers an exact street over one matched by stem", () => {
    const stem = candidate(2_500_000, false);
    const exact = candidate(2_500_050, true);
    const [point] = resolveCandidates(
      [target],
      [stem, exact],
      names,
    ).found.values();
    const [stemPoint] = resolveCandidates(
      [target],
      [stem],
      names,
    ).found.values();

    expect(point).not.toEqual(stemPoint);
  });

  it("refuses when the town has the address in places far apart", () => {
    const here = candidate(2_500_000, true);
    const there = candidate(2_507_000, true);

    const { found, ambiguous } = resolveCandidates(
      [target],
      [here, there],
      names,
    );

    expect(found.size).toBe(0);
    expect(ambiguous.get(target.id)).toHaveLength(2);
  });

  it("takes one address that a few close entries repeat", () => {
    const one = candidate(2_500_000, true);
    const two = candidate(2_500_040, true);

    expect(resolveCandidates([target], [one, two], names).found.size).toBe(1);
  });
});
