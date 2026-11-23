import { describe, expect, it } from "vitest";

import { formatStoreAddress, getCatalogNameLabel } from "@/utils/format/labels";

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
    ).toBe("Mlijeko 2,8%mm 1L b.č. UHT trajno z'bregov");
  });

  it("keeps a litre after a number in capitals", () => {
    expect(getCatalogNameLabel("SOK NARANČA 0,5L")).toBe("Sok naranča 0,5L");
    expect(getCatalogNameLabel("VODA 6X1L JAMNICA")).toBe("Voda 6x1L jamnica");
  });

  it("keeps common acronyms in capitals but not inside a word", () => {
    expect(getCatalogNameLabel("BIO JOGURT PET BOCA")).toBe(
      "BIO jogurt PET boca",
    );
    expect(getCatalogNameLabel("PAPIR WC XXL BIOLOGIC")).toBe(
      "Papir WC XXL biologic",
    );
  });

  it("starts with a capital after a leading count", () => {
    expect(getCatalogNameLabel("2 X 200G KEKSI PETIT")).toBe(
      "2 x 200g Keksi petit",
    );
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
