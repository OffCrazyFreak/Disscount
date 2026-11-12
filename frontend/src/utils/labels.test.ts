import { describe, expect, it } from "vitest";

import { formatStoreAddress } from "@/utils/labels";

describe("formatStoreAddress", () => {
  it("writes the street, then the postcode and town", () => {
    expect(
      formatStoreAddress({
        address: "Ilica 1",
        zipcode: "10000",
        cityLabel: "Zagreb",
      }),
    ).toBe("Ilica 1, 10000 Zagreb");
  });

  it("drops each missing part without a stray comma or space", () => {
    expect(
      formatStoreAddress({
        address: "Ilica 1",
        zipcode: null,
        cityLabel: "Zagreb",
      }),
    ).toBe("Ilica 1, Zagreb");

    expect(
      formatStoreAddress({
        address: null,
        zipcode: "10000",
        cityLabel: "Zagreb",
      }),
    ).toBe("10000 Zagreb");

    expect(
      formatStoreAddress({ address: "Ilica 1", zipcode: null, cityLabel: "" }),
    ).toBe("Ilica 1");
  });

  it("is empty when nothing is known, so the caller picks the fallback", () => {
    expect(
      formatStoreAddress({ address: null, zipcode: null, cityLabel: "" }),
    ).toBe("");
  });
});
