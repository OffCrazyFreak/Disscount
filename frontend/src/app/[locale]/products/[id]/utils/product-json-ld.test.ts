import { describe, expect, it } from "vitest";
import { productJsonLd } from "@/app/[locale]/products/[id]/utils/product-json-ld";
import type {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";

function chain(
  chainCode: string,
  min: string,
  max: string,
): ChainProductResponse {
  return {
    chain: chainCode,
    code: "1",
    name: "Coca-Cola",
    brand: null,
    category: null,
    unit: null,
    quantity: null,
    min_price: min,
    max_price: max,
    avg_price: min,
    price_date: "2026-11-01",
  };
}

function product(overrides: Partial<ProductResponse>): ProductResponse {
  return {
    ean: "5449000000996",
    brand: "Coca-Cola",
    name: "Coca-Cola Limenka",
    quantity: null,
    unit: null,
    chains: [chain("konzum", "0.89", "1.19"), chain("spar", "0.30", "1.35")],
    ...overrides,
  };
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

  it.each(["2831201000000", "5449000000997"])(
    "gives no gtin for the non-GTIN code %s",
    (ean) => {
      expect(
        productJsonLd({ product: product({ ean }), ...input }),
      ).not.toHaveProperty("gtin");
    },
  );
});
