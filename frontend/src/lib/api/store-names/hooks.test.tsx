import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import { useSearchStoreNames } from "@/lib/api/store-names/hooks";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";

// Signed out: the API client asks for a token first and sends the request without one.
const signedOut = http.get("*/api/auth/token", () =>
  HttpResponse.json(null, { status: 401 }),
);

describe("useSearchStoreNames", () => {
  it("returns the suggestions and asks in the page language", async () => {
    let request: Request | undefined;
    server.use(
      signedOut,
      http.get("*/api/store-names", ({ request: sent }) => {
        request = sent;
        return HttpResponse.json([{ name: "Konzum" }, { name: "Kaufland" }]);
      }),
    );

    const { result } = renderHookWithProviders(() => useSearchStoreNames("k"), {
      locale: "de",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      { name: "Konzum" },
      { name: "Kaufland" },
    ]);
    expect(new URL(request!.url).searchParams.get("q")).toBe("k");
    expect(request!.headers.get("Accept-Language")).toBe("de");
  });

  it("fails on a payload that does not match the schema", async () => {
    server.use(
      signedOut,
      http.get("*/api/store-names", () => HttpResponse.json([{ title: "x" }])),
    );

    const { result } = renderHookWithProviders(() => useSearchStoreNames("k"));

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("does not query an empty search", () => {
    const { result } = renderHookWithProviders(() => useSearchStoreNames(""));

    expect(result.current.fetchStatus).toBe("idle");
  });
});
