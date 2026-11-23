import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { BACKEND_ORIGIN } from "@/lib/api/backend-origin";
import {
  getCatalogCategories,
  getCategoryProducts,
} from "@/lib/api/catalog-categories/server";
import { server } from "@/test/msw-server";

vi.mock("server-only", () => ({}));

const PRODUCTS_URL = `${BACKEND_ORIGIN}/api/products/categories/mlijeko/products`;

describe("getCategoryProducts", () => {
  it("asks for the zero-based page the backend counts in", async () => {
    let asked: URLSearchParams | undefined;
    server.use(
      http.get(PRODUCTS_URL, ({ request }) => {
        asked = new URL(request.url).searchParams;

        return HttpResponse.json({
          items: [{ ean: "1", name: "Mlijeko", brand: null }],
          page: { number: 1, size: 24, totalItems: 25, totalPages: 2 },
        });
      }),
    );

    const page = await getCategoryProducts("mlijeko", 2);

    expect(asked?.get("page")).toBe("1");
    expect(asked?.get("size")).toBe("24");
    expect(page?.items).toHaveLength(1);
  });

  it("returns null for a category the backend does not know", async () => {
    server.use(
      http.get(
        `${BACKEND_ORIGIN}/api/products/categories/nope/products`,
        () => new HttpResponse(null, { status: 404 }),
      ),
    );

    await expect(getCategoryProducts("nope", 1)).resolves.toBeNull();
  });

  it("throws on an outage, so the page answers 500", async () => {
    server.use(
      http.get(PRODUCTS_URL, () => new HttpResponse(null, { status: 503 })),
    );

    await expect(getCategoryProducts("mlijeko", 3)).rejects.toThrow("503");
  });
});

describe("getCatalogCategories", () => {
  it("throws on an outage instead of listing no categories", async () => {
    server.use(
      http.get(
        `${BACKEND_ORIGIN}/api/products/categories`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    await expect(getCatalogCategories()).rejects.toThrow("500");
  });
});
