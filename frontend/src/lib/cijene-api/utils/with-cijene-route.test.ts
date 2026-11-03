import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { CijeneApiError } from "@/lib/cijene-api/errors";
import { withCijeneRoute } from "@/lib/cijene-api/utils/with-cijene-route";

const schema = z.object({ ean: z.string() });

function requestIn(acceptLanguage: string) {
  return new Request("http://localhost:3000/api/cijene/products/1", {
    headers: { "accept-language": acceptLanguage },
  });
}

describe("withCijeneRoute", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("answers an upstream failure with a translated problem", async () => {
    const response = await withCijeneRoute(
      requestIn("en"),
      "product",
      schema,
      () => Promise.reject(new Error("socket hang up")),
    );

    expect(response.status).toBe(502);
    expect(response.headers.get("content-type")).toBe(
      "application/problem+json",
    );
    expect(await response.json()).toEqual({
      status: 502,
      code: "upstream_unavailable",
      title: "Service unavailable",
    });
  });

  it("answers a payload that fails the schema the same way, without its details", async () => {
    const response = await withCijeneRoute(
      requestIn("hr"),
      "product",
      schema,
      () => Promise.resolve({ data: { ean: 42 } }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      status: 502,
      code: "upstream_unavailable",
      title: "Usluga nije dostupna",
    });
  });

  it("reports a rejected upstream token as unavailable, not as signed out", async () => {
    const response = await withCijeneRoute(
      requestIn("de"),
      "product",
      schema,
      () => Promise.reject(new CijeneApiError(401, "Authentication failed")),
    );

    expect(response.status).toBe(502);
    expect((await response.json()).title).toBe("Dienst nicht verfügbar");
  });

  it.each([
    [404, "not_found", 404, "Non lo troviamo"],
    [429, "too_many_requests", 429, "Troppi tentativi, aspetta un attimo"],
    [422, "bad_request", 400, "Richiesta non valida"],
  ])(
    "translates an upstream %i the caller could act on",
    async (upstreamStatus, code, status, title) => {
      const response = await withCijeneRoute(
        requestIn("it"),
        "product",
        schema,
        () => Promise.reject(new CijeneApiError(upstreamStatus, "Upstream")),
      );

      expect(response.status).toBe(status);
      expect(response.headers.get("content-type")).toBe(
        "application/problem+json",
      );
      expect(await response.json()).toEqual({ status, code, title });
    },
  );

  it("passes the payload through when it matches", async () => {
    const response = await withCijeneRoute(
      requestIn("hr"),
      "product",
      schema,
      () => Promise.resolve({ data: { ean: "3850104012345" } }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ean: "3850104012345" });
  });
});
