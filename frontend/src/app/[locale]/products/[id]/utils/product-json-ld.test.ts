import { describe, expect, it } from "vitest";
import { productJsonLd } from "@/app/[locale]/products/[id]/utils/product-json-ld";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { chain, product as priceProduct } from "@/test/price-fixtures";

function product(overrides: Partial<ProductResponse>) {
  return priceProduct(
    [chain("konzum", "0.89", "1.19"), chain("spar", "0.30", "1.35")],
    {
      ean: "5449000000996",
      brand: "Coca-Cola",
      name: "Coca-Cola Limenka",
      ...overrides,
    },
  );
}

const input = {
  url: "https://disscount.me/products/x",
  image: "https://i/x.jpg",
};

describe("productJsonLd", () => {
  it("spans the lowest and highest chain price with one offer per chain", () => {
    expect(productJsonLd({ product: product({}), ...input })).toMatchObject({
      "@type": "Product",
      gtin: "5449000000996",
      brand: { "@type": "Brand", name: "Coca-Cola" },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "EUR",
        lowPrice: "0.30",
        highPrice: "1.35",
        offerCount: 2,
      },
    });
  });

  it("leaves out gtin, brand and offers it has no data for", () => {
    const markup = productJsonLd({
      product: product({ ean: "spar:385864", brand: "", chains: [] }),
      ...input,
    });

    expect(markup).not.toHaveProperty("gtin");
    expect(markup).not.toHaveProperty("brand");
    expect(markup).not.toHaveProperty("offers");
  });

  it("carries the photo it is given", () => {
    expect(productJsonLd({ product: product({}), ...input }).image).toBe(
      input.image,
    );
  });

  it("leaves out image when the product has no confirmed photo", () => {
    const markup = productJsonLd({
      product: product({}),
      ...input,
      image: null,
    });

    expect(markup).not.toHaveProperty("image");
  });

  it.each(["2831201000000", "5449000000997"])(
    "gives no gtin for the non-GTIN code %s",
    (ean) => {
      expect(
        productJsonLd({ product: product({ ean }), ...input }),
      ).not.toHaveProperty("gtin");
    },
  );
});
