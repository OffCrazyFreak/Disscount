import { waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { useGetProductByName } from "@/lib/cijene-api/query-hooks";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";
import { product } from "@/test/price-fixtures";

const productsByQuery: Record<string, ReturnType<typeof product>[]> = {
  mlijeko: [product([], { ean: "3850108020090", name: "Mlijeko 2,8%" })],
  kruh: [product([], { ean: "3858881080416", name: "Kruh bijeli" })],
};

function serveSearch() {
  const queries: string[] = [];

  server.use(
    http.get("*/api/cijene/products", async ({ request }) => {
      const q = new URL(request.url).searchParams.get("q") ?? "";
      queries.push(q);
      if (q === "kruh") await delay(50);

      return HttpResponse.json({ products: productsByQuery[q] ?? [] });
    }),
  );

  return queries;
}

describe("useGetProductByName", () => {
  it("keeps the previous results on screen while the next search loads", async () => {
    serveSearch();
    let q = "mlijeko";
    const { result, rerender } = renderHookWithProviders(() =>
      useGetProductByName({ q }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    q = "kruh";
    rerender();

    expect(result.current.isPlaceholderData).toBe(true);
    expect(result.current.data?.products[0].name).toBe("Mlijeko 2,8%");

    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));
    expect(result.current.data?.products[0].name).toBe("Kruh bijeli");
  });

  it("shows no old results once the search is cleared", async () => {
    serveSearch();
    let q = "mlijeko";
    const { result, rerender } = renderHookWithProviders(() =>
      useGetProductByName({ q }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    q = "";
    rerender();

    expect(result.current.data).toBeUndefined();
  });

  it("does not query a whitespace-only search", () => {
    const queries = serveSearch();
    const { result } = renderHookWithProviders(() =>
      useGetProductByName({ q: "   " }),
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(queries).toEqual([]);
  });

  it("sends the trimmed query", async () => {
    const queries = serveSearch();
    const { result } = renderHookWithProviders(() =>
      useGetProductByName({ q: "  mlijeko " }),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queries).toEqual(["mlijeko"]);
  });
});
