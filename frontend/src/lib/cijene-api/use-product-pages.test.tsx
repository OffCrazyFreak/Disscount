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
          city: ["Split", "Krk"],
          brand: ["brand"],
          category: ["Mlijeko, jogurti"],
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
    expect(requests[1].searchParams.getAll("city")).toEqual(["Split", "Krk"]);
    expect(requests[1].searchParams.getAll("category")).toEqual([
      "Mlijeko, jogurti",
    ]);
    expect(Object.fromEntries(requests[1].searchParams)).toMatchObject({
      brand: "brand",
      chains: "chain",
      order: "price_desc",
      page_size: "2",
      cursor: "next",
    });
  });

  it("restarts from page one when new price data expires the cursor", async () => {
    let imported = false;
    const cursors: (string | null)[] = [];
    server.use(
      http.get("*/api/cijene/products", ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor");
        cursors.push(cursor);
        if (cursor) {
          imported = true;
          return HttpResponse.json(
            { status: 409, code: "cursor_expired", title: "Refresh" },
            { status: 409 },
          );
        }
        return HttpResponse.json({
          products: [product(imported ? "new" : "old")],
          next_cursor: imported ? null : "expired",
          source: "owned",
          generation: imported ? 2 : 1,
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
    await waitFor(() =>
      expect(result.current.data?.products.map((p) => p.ean)).toEqual(["new"]),
    );
    expect(result.current.data?.generation).toBe(2);
    expect(result.current.error).toBeNull();
    expect(cursors).toEqual([null, "expired", null]);
  });

  it("shows an error instead of restarting for a malformed cursor", async () => {
    const cursors: (string | null)[] = [];
    server.use(
      http.get("*/api/cijene/products", ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor");
        cursors.push(cursor);
        if (cursor) {
          return HttpResponse.json(
            { status: 400, code: "bad_request", title: "Bad" },
            { status: 400 },
          );
        }
        return HttpResponse.json({
          products: [product("old")],
          next_cursor: "broken",
          source: "owned",
        });
      }),
    );
    const { result } = renderHookWithProviders(() =>
      useProductPages({ q: "milk" }),
    );
    await waitFor(() => expect(result.current.data).toBeDefined());
    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(result.current.error).toBeTruthy();
    expect(result.current.data?.products.map((p) => p.ean)).toEqual(["old"]);
    expect(cursors).toEqual([null, "broken"]);
  });

  it("surfaces a search timeout as an error state", async () => {
    server.use(
      http.get("*/api/cijene/products", () =>
        HttpResponse.json(
          { status: 503, code: "search_timeout", title: "Unavailable" },
          { status: 503 },
        ),
      ),
    );
    const { result } = renderHookWithProviders(() =>
      useProductPages({ q: "milk" }),
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
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

it("clears an already loaded public page when the query becomes too short", async () => {
  server.use(
    http.get("*/api/cijene/products", () =>
      HttpResponse.json({ products: [product("old")] }),
    ),
  );
  let q = "milk";
  const { result, rerender } = renderHookWithProviders(() =>
    useProductPages({ q }),
  );
  await waitFor(() =>
    expect(result.current.data?.products[0]?.ean).toBe("old"),
  );
  q = "m";
  rerender();
  await waitFor(() => expect(result.current.data).toBeUndefined());
});

it("does not search while the query is empty", async () => {
  let requests = 0;
  server.use(
    http.get("*/api/cijene/products", () => {
      requests += 1;
      return HttpResponse.json({ products: [product("any")] });
    }),
  );

  const { result } = renderHookWithProviders(() => useProductPages({ q: "" }));

  await new Promise((resolve) => setTimeout(resolve, 40));
  expect(requests).toBe(0);
  expect(result.current.data).toBeUndefined();
  expect(result.current.fetchStatus).toBe("idle");
});

it("keeps the previous scope's products and facets while a new scope loads", async () => {
  let releaseSecond: () => void = () => {};
  const secondHeld = new Promise<void>((resolve) => {
    releaseSecond = resolve;
  });
  server.use(
    http.get("*/api/cijene/products", async ({ request }) => {
      const chains = new URL(request.url).searchParams.get("chains");
      if (chains) await secondHeld;

      return HttpResponse.json({
        products: [product(chains ? "scoped" : "all")],
        source: "owned",
        facets: {
          chain: chains ? { konzum: 1 } : { konzum: 4, spar: 2 },
          city: {},
          brand: {},
          category: {},
        },
      });
    }),
  );
  let scope: { chains?: string } = {};
  const { result, rerender } = renderHookWithProviders(() =>
    useProductPages({ q: "milk", ...scope }),
  );
  await waitFor(() =>
    expect(result.current.data?.products[0]?.ean).toBe("all"),
  );

  scope = { chains: "konzum" };
  rerender();

  await waitFor(() => expect(result.current.isFetching).toBe(true));
  expect(result.current.isPlaceholderData).toBe(true);
  expect(result.current.data?.products[0]?.ean).toBe("all");
  expect(result.current.data?.facets?.chain).toEqual({ konzum: 4, spar: 2 });

  releaseSecond();
  await waitFor(() =>
    expect(result.current.data?.products[0]?.ean).toBe("scoped"),
  );
  expect(result.current.isPlaceholderData).toBe(false);
});

it("returns the same merged data object between renders", async () => {
  server.use(
    http.get("*/api/cijene/products", () =>
      HttpResponse.json({ products: [product("a")], source: "owned" }),
    ),
  );
  const { result, rerender } = renderHookWithProviders(() =>
    useProductPages({ q: "milk" }),
  );
  await waitFor(() => expect(result.current.data).toBeDefined());
  const first = result.current.data;

  rerender();

  expect(result.current.data).toBe(first);
  expect(result.current.data?.products).toBe(first?.products);
});
