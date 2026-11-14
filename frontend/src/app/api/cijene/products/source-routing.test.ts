import { beforeEach, expect, it, vi } from "vitest";
import { locationNamesMap } from "@/constants/name-mappings";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
const clients = vi.hoisted(() => ({
  enabled: true,
  latest: { get: vi.fn() },
  public: { get: vi.fn() },
}));
vi.mock("@/lib/cijene-api/client", () => ({
  get cijeneLatestClient() {
    return clients.enabled ? clients.latest : undefined;
  },
  cijeneApiV1Client: clients.public,
}));
const product = {
  ean: "3850102127252",
  name: "test",
  brand: null,
  quantity: null,
  unit: null,
  chains: [],
};
beforeEach(() => {
  vi.clearAllMocks();
  clients.enabled = true;
  clients.latest.get.mockResolvedValue({ data: product });
  clients.public.get.mockResolvedValue({ data: product });
});
it("sends dated product charts only to public history", async () => {
  const { GET } = await import("@/app/api/cijene/products/[ean]/route");
  await GET(
    new NextRequest(
      "http://localhost/api/cijene/products/3850102127252?date=2026-11-01",
    ),
    { params: Promise.resolve({ ean: product.ean }) },
  );
  expect(clients.public.get).toHaveBeenCalledWith(
    "/products/3850102127252?date=2026-11-01",
  );
  expect(clients.latest.get).not.toHaveBeenCalled();
});
it("honors identity scope through the owned source without fuzzy fallback", async () => {
  const { searchProducts } =
    await import("@/lib/cijene-api/server/search-products");
  const controller = new AbortController();
  const response = await searchProducts(
    {
      q: product.ean,
      city: "Split",
      category: "food",
      brand: "brand",
      chains: "chain",
    },
    controller.signal,
  );
  expect(clients.latest.get).toHaveBeenCalledWith(`/products/${product.ean}/`, {
    params: {
      city: "Split",
      category: "food",
      brand: "brand",
      chains: "chain",
    },
    signal: controller.signal,
  });
  expect(response.data).toMatchObject({ products: [product], source: "owned" });
  expect(clients.public.get).not.toHaveBeenCalled();
});

it("forwards every owned search filter and page boundary through the route", async () => {
  clients.latest.get.mockResolvedValue({
    data: {
      products: [],
      generation: 8,
      total: 0,
      next_cursor: null,
      complete: true,
      partial: true,
      facets: { chain: {}, city: {}, brand: {}, category: {} },
    },
  });
  const { GET } = await import("@/app/api/cijene/products/route");
  const request = new NextRequest(
    "http://localhost/api/cijene/products?q=milk&chains=chain&city=Split&brand=brand&category=food&order=price_asc&page_size=2&cursor=opaque",
  );
  const response = await GET(request);
  expect(response.status).toBe(200);
  expect(clients.latest.get).toHaveBeenCalledWith("/products/", {
    params: {
      q: "milk",
      city_labels: JSON.stringify(
        Object.fromEntries(
          Object.entries(locationNamesMap).filter(
            ([source, label]) => source !== label,
          ),
        ),
      ),
      chains: "chain",
      city: "Split",
      brand: "brand",
      category: "food",
      order: "price_asc",
      page_size: 2,
      cursor: "opaque",
    },
    signal: request.signal,
  });
  expect(await response.json()).toMatchObject({
    total: 0,
    complete: true,
    partial: true,
    generation: 8,
  });
});

it("retains the chain filter when public fallback cannot sort", async () => {
  clients.enabled = false;
  clients.public.get.mockResolvedValue({ data: { products: [] } });
  const { searchProducts } =
    await import("@/lib/cijene-api/server/search-products");
  await searchProducts({ q: "milk", chains: "konzum", order: "relevance" });
  expect(clients.public.get).toHaveBeenCalled();
  for (const [path] of clients.public.get.mock.calls) {
    expect(
      new URL(path as string, "https://fixture.invalid").searchParams.get(
        "chains",
      ),
    ).toBe("konzum");
  }
});
