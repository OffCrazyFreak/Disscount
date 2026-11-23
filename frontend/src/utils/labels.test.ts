import { describe, expect, it } from "vitest";

import { formatStoreAddress, getCatalogNameLabel } from "@/utils/labels";

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

describe("getCatalogNameLabel", () => {
  it("writes a name sent in capitals in sentence case", () => {
    expect(
      getCatalogNameLabel("MLIJEKO 2,8%MM 1L B.Č. UHT TRAJNO Z'BREGOV"),
    ).toBe("Mlijeko 2,8%mm 1l b.č. uht trajno z'bregov");
  });

  it("treats a name with a few lower-case units as capitals", () => {
    expect(getCatalogNameLabel("OPAL PASTA 375ml METEOR DET.ZA RUB.")).toBe(
      "Opal pasta 375ml meteor det.za rub.",
    );
  });

  it("leaves a name already in mixed case as sent", () => {
    expect(getCatalogNameLabel("Zvijezda Ulje suncokretovo 1L_OC")).toBe(
      "Zvijezda Ulje suncokretovo 1L_OC",
    );
  });
});
