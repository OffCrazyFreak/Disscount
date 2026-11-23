import type { ResolvingMetadata } from "next";
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SimilarProducts from "@/features/products/detail/components/similar-products";
import ProductDetailsPage, {
  generateMetadata,
} from "@/app/[locale]/products/[id]/page";
import {
  getCategoryProducts,
  getProductCategorySlug,
} from "@/lib/api/catalog-categories/server";
import { getServerProduct } from "@/lib/cijene-api/server/get-product";
import { product } from "@/test/fixtures/price-fixtures";

vi.mock("server-only", () => ({}));

vi.mock("next-intl/server", () => ({
  getLocale: async () => "hr",
  getTranslations: async () =>
    Object.assign((key: string) => key, { has: () => false }),
}));

vi.mock("@/lib/api/product-images/server", () => ({
  getVerifiedProductImages: async () => null,
  getVerifiedMainPhotoUrl: async () => null,
}));

vi.mock("@/lib/cijene-api/server/get-product-prices", () => ({
  getServerProductPrices: async () => null,
}));

vi.mock("@/lib/api/catalog-categories/server", () => ({
  OPTIONAL_LOOKUP_TIMEOUT_MS: 2_500,
  getProductCategorySlug: vi.fn(),
  getCategoryProducts: vi.fn(),
}));

vi.mock("@/lib/cijene-api/server/get-product", () => ({
  getServerProduct: vi.fn(),
}));

const EAN = "5449000000996";

const PROPS = {
  params: Promise.resolve({ locale: "hr", id: EAN }),
} as PageProps<"/[locale]/products/[id]">;

function similarProductsIn(page: ReactElement<{ children?: ReactNode }>) {
  return Children.toArray(page.props.children).find(
    (child): child is ReactElement<{ products: { ean: string }[] }> =>
      isValidElement(child) && child.type === SimilarProducts,
  );
}

function metadataFor() {
  return generateMetadata(
    PROPS,
    // Only a found product reads the layout metadata.
    Promise.resolve({}) as ResolvingMetadata,
  );
}

describe("product page", () => {
  beforeEach(() => {
    vi.mocked(getServerProduct).mockReset();
    vi.mocked(getProductCategorySlug).mockResolvedValue("mlijeko");
    vi.mocked(getCategoryProducts).mockResolvedValue({
      items: [
        { ean: EAN, name: "Ovaj proizvod", brand: null },
        { ean: "385001", name: "Dukat mlijeko", brand: "Dukat" },
      ],
      page: { number: 0, size: 24, totalItems: 2, totalPages: 1 },
    });
  });

  function found() {
    vi.mocked(getServerProduct).mockResolvedValue({
      status: "found",
      product: product([], { ean: EAN }),
      fetchedAt: 0,
    });
  }

  it("links the other products of its category", async () => {
    found();

    const page = await ProductDetailsPage(PROPS);

    expect(getCategoryProducts).toHaveBeenCalledWith("mlijeko", 1, 2_500);
    expect(
      similarProductsIn(page)?.props.products.map((item) => item.ean),
    ).toEqual(["385001"]);
  });

  it("shows no similar products for a product without a category", async () => {
    found();
    vi.mocked(getProductCategorySlug).mockResolvedValue(null);

    const page = await ProductDetailsPage(PROPS);

    expect(getCategoryProducts).not.toHaveBeenCalled();
    expect(similarProductsIn(page)).toBeUndefined();
  });

  it("still renders when the category products cannot be read", async () => {
    found();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(getCategoryProducts).mockRejectedValue(new Error("503"));

    expect(similarProductsIn(await ProductDetailsPage(PROPS))).toBeUndefined();
  });

  it("throws while upstream is down, so the page answers with a 5xx", async () => {
    vi.mocked(getServerProduct).mockResolvedValue({ status: "unavailable" });

    await expect(ProductDetailsPage(PROPS)).rejects.toThrow(EAN);
  });

  it("leaves robots alone while upstream is down", async () => {
    vi.mocked(getServerProduct).mockResolvedValue({ status: "unavailable" });

    const metadata = await metadataFor();

    expect(metadata.robots).toBeUndefined();
  });

  it("clears the layout's self canonical while upstream is down", async () => {
    vi.mocked(getServerProduct).mockResolvedValue({ status: "unavailable" });

    // Next replaces alternates whole, so this null wins over the layout's canonical "./".
    expect((await metadataFor()).alternates).toEqual({ canonical: null });
  });
});
