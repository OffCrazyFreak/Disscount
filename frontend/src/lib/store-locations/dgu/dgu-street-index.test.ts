import { describe, expect, it } from "vitest";

import { parseAddress } from "@/lib/store-locations/address-key";
import { createStreetIndex } from "@/lib/store-locations/dgu/dgu-street-index";

describe("createStreetIndex", () => {
  it("finds a target that abbreviates the street to three letters", () => {
    const index = createStreetIndex([parseAddress("Set. 10")]);

    expect(index.match("Šetalište")?.targets).toEqual([0]);
  });

  it("ignores streets no target could be on", () => {
    const index = createStreetIndex([parseAddress("Ilica 10")]);

    expect(index.match("Vukovarska")).toBeNull();
  });
});
