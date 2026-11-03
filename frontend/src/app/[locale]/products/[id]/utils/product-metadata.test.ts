import { afterEach, describe, expect, it, vi } from "vitest";
import { productMetadata } from "@/app/[locale]/products/[id]/utils/product-metadata";

const base = {
  ean: "5449000000996",
  title: "Coca-Cola Limenka: usporedi cijene",
  description: "Opis",
  photoUrl: null,
  parent: {
    openGraph: null,
    twitter: null,
  },
};

describe("productMetadata", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("indexes Croatian with an absolute title and no hreflang", () => {
    const metadata = productMetadata({ ...base, locale: "hr" });

    expect(metadata.title).toEqual({ absolute: base.title });
    expect(metadata.robots).toBeUndefined();
    expect(metadata.alternates).toEqual({
      canonical: "http://localhost:3000/products/5449000000996",
    });
  });

  it("keeps translations out of the index but lets crawlers follow links", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://disscount.me");

    const metadata = productMetadata({ ...base, locale: "de" });

    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe(
      "https://disscount.me/de/products/5449000000996",
    );
  });

  it("shares a 1200x630 card of the product photo when there is one", () => {
    const photoUrl = "https://images.test/full.jpg";
    const metadata = productMetadata({ ...base, locale: "hr", photoUrl });

    const card = {
      url: expect.stringMatching(
        /^http:\/\/localhost:3000\/og\/products\/5449000000996\/[0-9a-f]{16}\.jpg$/,
      ),
      width: 1200,
      height: 630,
      type: "image/jpeg",
      alt: base.title,
    };

    expect(metadata.openGraph?.images).toEqual([card]);
    expect(metadata.twitter?.images).toEqual([card]);
  });

  it("keeps the layout's brand image without a photo", () => {
    const brand = [
      { url: new URL("https://disscount.me/opengraph-image/brand") },
    ];
    const metadata = productMetadata({
      ...base,
      locale: "hr",
      parent: {
        openGraph: { images: brand } as never,
        twitter: { images: brand } as never,
      },
    });

    expect(metadata.openGraph?.images).toBe(brand);
    expect(metadata.twitter?.images).toBe(brand);
  });
});
