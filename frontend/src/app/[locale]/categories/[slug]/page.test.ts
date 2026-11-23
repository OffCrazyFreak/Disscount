import { beforeEach, describe, expect, it, vi } from "vitest";

import CategoryPage, {
  generateMetadata,
} from "@/app/[locale]/categories/[slug]/page";
import {
  getCatalogCategories,
  getCategoryProducts,
} from "@/lib/api/catalog-categories/server";
import { getServerProduct } from "@/lib/cijene-api/server/get-product";
import { appUrl } from "@/lib/env";

vi.mock("server-only", () => ({}));

const locale = vi.hoisted(() => ({ current: "hr" }));

vi.mock("next-intl/server", () => ({
  getLocale: async () => locale.current,
  getTranslations: async () =>
    Object.assign((key: string) => key, { has: () => false }),
}));

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/lib/api/catalog-categories/server", () => ({
  CATEGORY_PAGE_SIZE: 24,
  getCatalogCategories: vi.fn(),
  getCategoryProducts: vi.fn(),
}));

vi.mock("@/lib/cijene-api/server/get-product", () => ({
  getServerProduct: vi.fn(),
}));

function props(slug: string, page?: string) {
  return {
    params: Promise.resolve({ locale: locale.current, slug }),
    searchParams: Promise.resolve(page === undefined ? {} : { page }),
  } as PageProps<"/[locale]/categories/[slug]">;
}

describe("category page", () => {
  beforeEach(() => {
    locale.current = "hr";
    vi.mocked(getServerProduct).mockReset();
    vi.mocked(getCatalogCategories).mockResolvedValue({
      departments: [{ slug: "hrana", productCount: 30 }],
      categories: [
        {
          slug: "mlijeko",
          department: "hrana",
          indexable: true,
          productCount: 30,
        },
        { slug: "vino", department: "pice", indexable: false, productCount: 5 },
      ],
    });
    vi.mocked(getCategoryProducts).mockImplementation(async (_, page) => ({
      items: [{ ean: `${page}`, name: "Mlijeko", brand: null }],
      page: { number: page - 1, size: 24, totalItems: 30, totalPages: 2 },
    }));
  });

  it("canonicalises a later page to itself and keeps an indexable hub indexable", async () => {
    const metadata = await generateMetadata(props("mlijeko", "2"));

    expect(metadata.alternates?.canonical).toBe(
      `${appUrl()}/categories/mlijeko?page=2`,
    );
    expect(metadata.robots).toBeUndefined();
  });

  it("keeps a category outside the ten out of the index", async () => {
    const metadata = await generateMetadata(props("vino"));

    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("keeps translated hubs out of the index", async () => {
    locale.current = "en";

    const metadata = await generateMetadata(props("mlijeko"));

    expect(metadata.alternates?.canonical).toBe(
      `${appUrl()}/en/categories/mlijeko`,
    );
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it.each([
    ["an unknown slug", "nope", undefined],
    ["page 0", "mlijeko", "0"],
    ["a page past the end", "mlijeko", "3"],
  ])("answers 404 for %s", async (_, slug, page) => {
    await expect(CategoryPage(props(slug, page))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("asks the backend for no page far past the product count", async () => {
    vi.mocked(getCategoryProducts).mockClear();

    await expect(CategoryPage(props("mlijeko", "5"))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(getCategoryProducts).not.toHaveBeenCalled();
  });

  it("lets the backend decide a page just past a count that may lag an import", async () => {
    vi.mocked(getCategoryProducts).mockClear();

    await expect(CategoryPage(props("mlijeko", "3"))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(getCategoryProducts).toHaveBeenCalledWith("mlijeko", 3);
  });

  it("still answers 404 when the backend has fewer pages than the count says", async () => {
    vi.mocked(getCatalogCategories).mockResolvedValue({
      departments: [],
      categories: [
        {
          slug: "mlijeko",
          department: "hrana",
          indexable: true,
          productCount: 200,
        },
      ],
    });

    await expect(CategoryPage(props("mlijeko", "3"))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("asks upstream for prices on page 1 only", async () => {
    vi.mocked(getServerProduct).mockResolvedValue({
      status: "found",
      product: { ean: "1", chains: [] } as never,
      fetchedAt: 0,
    });

    await CategoryPage(props("mlijeko"));
    expect(getServerProduct).toHaveBeenCalledWith("1");

    vi.mocked(getServerProduct).mockClear();
    await CategoryPage(props("mlijeko", "2"));
    expect(getServerProduct).not.toHaveBeenCalled();
  });

  it("fails page 1 when the price API answers no product, so it is not indexed unpriced", async () => {
    vi.mocked(getServerProduct).mockResolvedValue({ status: "unavailable" });

    await expect(CategoryPage(props("mlijeko"))).rejects.toThrow("unavailable");
  });

  it("keeps an empty indexable category out of the index", async () => {
    vi.mocked(getCatalogCategories).mockResolvedValue({
      departments: [],
      categories: [
        {
          slug: "mlijeko",
          department: "hrana",
          indexable: true,
          productCount: 0,
        },
      ],
    });

    const metadata = await generateMetadata(props("mlijeko"));

    expect(metadata.robots).toMatchObject({ index: false });
  });
});
