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
function requestedUrl(call: unknown[]) {
  return new URL(call[0] as string, "https://fixture.invalid");
}

it("honors identity scope through the owned source without fuzzy fallback", async () => {
  const { searchProducts } =
    await import("@/lib/cijene-api/server/search-products");
  const controller = new AbortController();
  const response = await searchProducts(
    {
      q: product.ean,
      city: ["Split"],
      category: ["food"],
      brand: ["brand"],
      chains: "chain",
    },
    controller.signal,
  );
  const [call] = clients.latest.get.mock.calls;
  const url = requestedUrl(call);
  expect(url.pathname).toBe(`/products/${product.ean}/`);
  expect(url.searchParams.getAll("city")).toEqual(["Split"]);
  expect(url.searchParams.getAll("category")).toEqual(["food"]);
  expect(url.searchParams.getAll("brand")).toEqual(["brand"]);
  expect(url.searchParams.get("chains")).toBe("chain");
  expect(url.searchParams.get("city_labels")).toBe(
    JSON.stringify(
      Object.fromEntries(
        Object.entries(locationNamesMap).filter(
          ([source, label]) => source !== label,
        ),
      ),
    ),
  );
  expect(call[1]).toEqual({ signal: controller.signal });
  expect(response.data).toMatchObject({
    products: [product],
    source: "owned",
    partial: false,
  });
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
    "http://localhost/api/cijene/products?q=milk&chains=chain,spar&city=Split&city=6C+KRK&brand=brand&category=Mlijeko%2C+jogurti&category=food&order=price_asc&page_size=2&cursor=opaque",
  );
  const response = await GET(request);
  expect(response.status).toBe(200);
  const [call] = clients.latest.get.mock.calls;
  const url = requestedUrl(call);
  expect(url.pathname).toBe("/products/");
  expect(Object.fromEntries(url.searchParams)).toMatchObject({
    q: "milk",
    chains: "chain,spar",
    brand: "brand",
    order: "price_asc",
    page_size: "2",
    cursor: "opaque",
    city_labels: JSON.stringify(
      Object.fromEntries(
        Object.entries(locationNamesMap).filter(
          ([source, label]) => source !== label,
        ),
      ),
    ),
  });
  expect(url.searchParams.getAll("city")).toEqual(["Split", "6C KRK"]);
  expect(url.searchParams.getAll("category")).toEqual([
    "Mlijeko, jogurti",
    "food",
  ]);
  expect(call[1]).toEqual({ signal: request.signal });
  expect(await response.json()).toMatchObject({
    total: 0,
    complete: true,
    partial: true,
    generation: 8,
  });
});

it("sends public search no scope, so the browser can count every chain", async () => {
  clients.enabled = false;
  clients.public.get.mockResolvedValue({ data: { products: [] } });
  const { searchProducts } =
    await import("@/lib/cijene-api/server/search-products");
  await searchProducts({
    q: "milk",
    chains: "konzum",
    city: ["Split"],
    category: ["food"],
    brand: ["brand"],
    order: "relevance",
  });
  expect(clients.public.get).toHaveBeenCalled();
  for (const call of clients.public.get.mock.calls) {
    const params = requestedUrl(call).searchParams;
    expect(params.get("q")).toBe("milk");
    for (const scoped of ["chains", "city", "category", "brand", "order"]) {
      expect(params.has(scoped)).toBe(false);
    }
  }
});

it("reports partial prices on a barcode lookup only when the product says so", async () => {
  clients.latest.get.mockResolvedValue({ data: { ...product, partial: true } });
  const { searchProducts } =
    await import("@/lib/cijene-api/server/search-products");

  const response = await searchProducts({ q: product.ean });

  expect(response.data).toMatchObject({ partial: true, total: 1 });
});
