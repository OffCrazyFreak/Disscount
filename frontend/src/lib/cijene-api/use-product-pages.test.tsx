import { QueryClient } from "@tanstack/react-query";
import { getCachedProductNames } from "@/lib/cijene-api/cached-product-names";
import { act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import useProductPages from "@/lib/cijene-api/use-product-pages";
import { renderHookWithProviders } from "@/test/render";
import { server } from "@/test/msw-server";

const product = (ean: string) => ({
  ean,
  name: ean,
  brand: null,
  quantity: null,
  unit: null,
  chains: [],
});

describe("server product pages", () => {
  it("keeps server order and scope and deduplicates subsequent pages", async () => {
    const requests: URL[] = [];
    server.use(
      http.get("*/api/cijene/products", ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        return HttpResponse.json({
          products: url.searchParams.has("cursor")
            ? [product("b"), product("c")]
            : [product("b"), product("a")],
          source: "owned",
          total: 3,
          generation: 4,
          complete: true,
          partial: true,
          next_cursor: url.searchParams.has("cursor") ? null : "next",
          facets: { chain: {}, city: {}, brand: {}, category: {} },
        });
      }),
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHookWithProviders(
      () =>
        useProductPages({
          q: "milk",
          city: "Split",
          brand: "brand",
          category: "food",
          chains: "chain",
          order: "price_desc",
          page_size: 2,
        }),
      { queryClient },
    );
    await waitFor(() => expect(result.current.data?.products).toHaveLength(2));
    expect(result.current.data?.products.map((p) => p.ean)).toEqual(["b", "a"]);
    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(result.current.data?.products.map((p) => p.ean)).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(result.current.data).toMatchObject({
      total: 3,
      partial: true,
      complete: true,
      generation: 4,
    });
    expect(getCachedProductNames(queryClient)).toEqual(["b", "a", "c"]);
    expect(Object.fromEntries(requests[1].searchParams)).toMatchObject({
      city: "Split",
      brand: "brand",
      category: "food",
      chains: "chain",
      order: "price_desc",
      page_size: "2",
      cursor: "next",
    });
  });

  it("restarts unavailable cursors without keeping old generation rows", async () => {
    let restarted = false;
    server.use(
      http.get("*/api/cijene/products", ({ request }) => {
        if (new URL(request.url).searchParams.has("cursor")) {
          restarted = true;
          return HttpResponse.json({}, { status: 400 });
        }
        return HttpResponse.json({
          products: [product(restarted ? "new" : "old")],
          next_cursor: restarted ? null : "expired",
          source: "owned",
          generation: restarted ? 2 : 1,
        });
      }),
    );
    const { result } = renderHookWithProviders(() =>
      useProductPages({ q: "milk" }),
    );
    await waitFor(() =>
      expect(result.current.data?.products[0].ean).toBe("old"),
    );
    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(result.current.data?.products.map((p) => p.ean)).toEqual(["new"]);
  });
});

it("aborts stale pages and disables a shrinking one-character query", async () => {
  let aborted = false;
  server.use(
    http.get("*/api/cijene/products", async ({ request }) => {
      request.signal.addEventListener("abort", () => {
        aborted = true;
      });
      await new Promise((resolve) => setTimeout(resolve, 200));
      return HttpResponse.json({ products: [product("stale")] });
    }),
  );
  let q = "milk";
  const { result, rerender } = renderHookWithProviders(() =>
    useProductPages({ q }),
  );
  await new Promise((resolve) => setTimeout(resolve, 40));
  q = "m";
  rerender();
  await waitFor(() => expect(aborted).toBe(true));
  expect(result.current.data).toBeUndefined();
});
