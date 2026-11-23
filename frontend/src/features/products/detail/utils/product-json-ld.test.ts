import { describe, expect, it } from "vitest";
import { productJsonLd } from "@/features/products/detail/utils/product-json-ld";
import {
  productResponseSchema,
  type ChainProductResponse,
  type ProductResponse,
} from "@/lib/cijene-api/schemas";
import {
  chain,
  product as priceProduct,
  wireProduct,
} from "@/test/fixtures/price-fixtures";

function product(overrides: Partial<ProductResponse>) {
  return priceProduct([chain("konzum", 0.89, 1.19), chain("spar", 0.3, 1.35)], {
    ean: "5449000000996",
    brand: "Coca-Cola",
    name: "Coca-Cola Limenka",
    ...overrides,
  });
}

/** Sent through the price schema, so a price upstream cannot read or publishes as zero is dealt with as on the page. */
function parsedProduct(chains: ChainProductResponse[]) {
  return productResponseSchema.parse(wireProduct(priceProduct(chains)));
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

  it("describes one chain's price as one offer sold by that chain", () => {
    const markup = productJsonLd({
      product: priceProduct([chain("konzum", 0.89, 1.19, 0.99)]),
      ...input,
    });

    expect(markup.offers?.offers).toEqual([
      {
        "@type": "Offer",
        price: "0.89",
        priceCurrency: "EUR",
        seller: { "@type": "Organization", name: "Konzum" },
      },
    ]);
  });

  it("gives every chain its own offer at the lowest price its row shows", () => {
    const markup = productJsonLd({ product: product({}), ...input });

    expect(markup.offers?.offers).toEqual([
      expect.objectContaining({
        price: "0.89",
        seller: { "@type": "Organization", name: "Konzum" },
      }),
      expect.objectContaining({
        price: "0.30",
        seller: { "@type": "Organization", name: "Spar" },
      }),
    ]);
  });

  it("leaves out a chain whose price cannot be read", () => {
    const markup = productJsonLd({
      product: parsedProduct([
        chain("konzum", 0.89),
        chain("spar", Number.NaN),
      ]),
      ...input,
    });

    expect(markup.offers?.offers.map((offer) => offer.seller.name)).toEqual([
      "Konzum",
    ]);
  });

  it("leaves a zero price out of the offers and the price range", () => {
    const markup = productJsonLd({
      product: parsedProduct([chain("konzum", 0.89), chain("roto", 0)]),
      ...input,
    });

    expect(markup.offers).toMatchObject({
      lowPrice: "0.89",
      highPrice: "0.89",
      offerCount: 1,
    });
  });

  it("counts only the offers it lists", () => {
    const markup = productJsonLd({
      product: parsedProduct([
        chain("konzum", 0.89),
        chain("spar", Number.NaN),
      ]),
      ...input,
    });

    expect(markup.offers?.offerCount).toBe(1);
  });

  it("dates the markup by the newest chain price date", () => {
    const markup = productJsonLd({
      product: priceProduct([
        { ...chain("konzum", 0.89), price_date: "2026-11-20" },
        { ...chain("spar", 0.3), price_date: "2026-11-22" },
        { ...chain("lidl", 0.5), price_date: "2026-11-21" },
      ]),
      ...input,
    });

    expect(markup.dateModified).toBe("2026-11-22");
  });

  it("leaves out gtin, brand, offers and dateModified it has no data for", () => {
    const markup = productJsonLd({
      product: product({ ean: "spar:385864", brand: "", chains: [] }),
      ...input,
    });

    expect(markup).not.toHaveProperty("gtin");
    expect(markup).not.toHaveProperty("brand");
    expect(markup).not.toHaveProperty("offers");
    expect(markup).not.toHaveProperty("dateModified");
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
