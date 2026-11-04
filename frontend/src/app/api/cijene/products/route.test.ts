import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CijeneApiError } from "@/lib/cijene-api/errors";

vi.mock("server-only", () => ({}));

const { upstreamGet } = vi.hoisted(() => ({ upstreamGet: vi.fn() }));
vi.mock("@/lib/cijene-api/client", () => ({
  cijeneApiV1Client: { get: upstreamGet },
}));

const { GET } = await import("@/app/api/cijene/products/route");

const BARCODE = "3850102127252";
const product = {
  ean: BARCODE,
  brand: "Kraš",
  name: "Bananko",
  quantity: null,
  unit: null,
  chains: [],
};

function search(q: string) {
  return GET(
    new NextRequest(
      `http://localhost:3000/api/cijene/products?q=${encodeURIComponent(q)}`,
    ),
  );
}

describe("GET /api/cijene/products", () => {
  beforeEach(() => {
    upstreamGet.mockReset();
  });

  it("answers bad parameters with a translated problem", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/api/cijene/products", {
        headers: { "accept-language": "sl" },
      }),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toBe(
      "application/problem+json",
    );
    expect(await response.json()).toEqual({
      status: 400,
      code: "bad_request",
      title: "Neveljavna zahteva",
    });
  });

  it("finds a typed barcode through the lookup a scan uses", async () => {
    upstreamGet.mockResolvedValue({ data: product });

    const response = await search(BARCODE);

    expect(upstreamGet).toHaveBeenCalledWith(`/products/${BARCODE}`);
    expect(await response.json()).toMatchObject({
      products: [{ ean: BARCODE, name: "Bananko" }],
    });
  });

  it("falls back to the name search for a number no product carries", async () => {
    upstreamGet.mockImplementation((url: string) =>
      url.startsWith("/products?")
        ? Promise.resolve({ data: { products: [] } })
        : Promise.reject(new CijeneApiError(404, "Not found")),
    );

    const response = await search("12345678901234567890");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ products: [] });
  });

  it("does not spend a barcode lookup on an ordinary search", async () => {
    upstreamGet.mockResolvedValue({ data: { products: [product] } });

    await search("mlijeko");

    expect(upstreamGet).not.toHaveBeenCalledWith("/products/mlijeko");
  });
});
