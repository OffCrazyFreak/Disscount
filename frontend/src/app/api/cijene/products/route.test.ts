import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { GET } = await import("@/app/api/cijene/products/route");

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
});
