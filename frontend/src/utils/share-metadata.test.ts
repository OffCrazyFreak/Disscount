import type { ResolvingMetadata } from "next";
import { describe, expect, it } from "vitest";

import { withSharePreview } from "@/utils/share-metadata";

const brandImage = [{ url: "https://disscount.me/opengraph-image.png" }];

const parent = Promise.resolve({
  openGraph: { locale: "hr_HR", images: brandImage },
  twitter: { images: brandImage },
}) as unknown as ResolvingMetadata;

describe("withSharePreview", () => {
  it("shares the page's own title, description and URL with the brand image", async () => {
    const metadata = await withSharePreview(
      {
        title: "Karta trgovina",
        description: "Sve trgovine na karti.",
        alternates: { canonical: "https://disscount.me/map" },
      },
      parent,
    );

    expect(metadata.title).toBe("Karta trgovina");
    expect(metadata.openGraph).toMatchObject({
      title: "Disscount - Karta trgovina",
      description: "Sve trgovine na karti.",
      url: "https://disscount.me/map",
      locale: "hr_HR",
      images: brandImage,
    });
    expect(metadata.twitter).toMatchObject({
      title: "Disscount - Karta trgovina",
      images: brandImage,
    });
  });
});
