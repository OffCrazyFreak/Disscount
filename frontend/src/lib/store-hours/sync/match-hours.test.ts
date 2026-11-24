import { describe, expect, it } from "vitest";

import type { StoreResponse } from "@/lib/cijene-api/schemas";
import { matchHours } from "@/lib/store-hours/sync/match-hours";

const hours = { weekly: Array(7).fill([]), dated: [] };

function upstream(code: string, address: string, city: string): StoreResponse {
  return {
    chain_code: "studenac",
    code,
    type: null,
    address,
    city,
    zipcode: null,
    lat: null,
    lon: null,
    phone: null,
  };
}

describe("matchHours", () => {
  it("joins by code when a source has no coordinates", () => {
    const matched = matchHours(
      "studenac",
      [{ code: "T053", address: "Put Gaja 17", city: "Imotski", hours }],
      [
        upstream("T053", "Put Gaja 17", "Imotski"),
        upstream("T100", "Ribnjak 17", "Omiš"),
      ],
    );

    expect(matched.map((match) => match.code)).toEqual(["T053"]);
  });

  it("joins by address and town like a locator pin", () => {
    const matched = matchHours(
      "studenac",
      [{ address: "Ribnjak 17", city: "Omiš", lat: 43.44, lon: 16.69, hours }],
      [upstream("T100", "Ribnjak 17", "Omiš")],
    );

    expect(matched).toHaveLength(1);
  });
});
