import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw-server";

vi.mock("server-only", () => ({}));

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
    server.use(
      http.get(`*/v1/products/${BARCODE}`, () => HttpResponse.json(product)),
    );

    const response = await search(BARCODE);

    expect(await response.json()).toMatchObject({
      products: [{ ean: BARCODE, name: "Bananko" }],
    });
  });

  it("falls back to the name search for a number no product carries", async () => {
    const unknownNumber = "12345678901234567890";
    server.use(
      http.get(`*/v1/products/${unknownNumber}`, () =>
        HttpResponse.json({ detail: "Not found" }, { status: 404 }),
      ),
      http.get("*/v1/products", () => HttpResponse.json({ products: [] })),
    );

    const response = await search(unknownNumber);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ products: [] });
  });

  it("still searches by name when the barcode lookup is down", async () => {
    server.use(
      http.get(`*/v1/products/${BARCODE}`, () =>
        HttpResponse.json(null, { status: 500 }),
      ),
      http.get("*/v1/products", () =>
        HttpResponse.json({ products: [product] }),
      ),
    );

    const response = await search(BARCODE);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      products: [{ ean: BARCODE }],
    });
  });

  // MSW fails any request a test did not declare, so a lookup here would fail the test.
  it("does not spend a barcode lookup on an ordinary search", async () => {
    server.use(
      http.get("*/v1/products", () =>
        HttpResponse.json({ products: [product] }),
      ),
    );

    const response = await search("mlijeko");

    expect(await response.json()).toMatchObject({
      products: [{ name: "Bananko" }],
    });
  });
});
