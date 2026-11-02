import { waitFor } from "@testing-library/react";
import { delay } from "msw";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import useInfiniteProducts from "@/app/[locale]/products/hooks/use-infinite-products";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";

const sugar = {
  ean: "3850104004421",
  brand: "Viro",
  name: "Šećer 1 kg",
  quantity: "1",
  unit: "kg",
  chains: [
    {
      chain: "konzum",
      code: "1",
      name: "Šećer 1 kg",
      brand: "Viro",
      category: "Šećer",
      unit: "kg",
      quantity: "1",
      min_price: "1.29",
      max_price: "1.49",
      avg_price: "1.39",
      price_date: "2026-11-01",
    },
  ],
};

function serveSearch(
  locationPrices: Record<string, { min: number; max: number }>,
  partial = false,
) {
  server.use(
    http.get("*/api/cijene/products", () =>
      HttpResponse.json({ products: [sugar] }),
    ),
    http.get("*/api/cijene/location-prices", () =>
      HttpResponse.json({ prices: locationPrices, partial }),
    ),
  );
}

const inDakovo = {
  allowedChains: ["konzum"],
  selectedLocations: ["Đakovo"],
  selectedSourceCities: ["Đakovo"],
};

describe("useInfiniteProducts outside the selected locations", () => {
  it("reports matches when the selected places price none of them", async () => {
    serveSearch({});

    const { result } = renderHookWithProviders(() =>
      useInfiniteProducts("šećer", inDakovo),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.total).toBe(0);
    expect(result.current.hasMatchesOutsideLocations).toBe(true);
  });

  it("reports none when the chain filter rules the product out anywhere", async () => {
    serveSearch({});

    const { result } = renderHookWithProviders(() =>
      useInfiniteProducts("šećer", {
        ...inDakovo,
        allowedChains: [],
        selectedChains: ["spar"],
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasMatchesOutsideLocations).toBe(false);
  });

  it("reports none without a location filter", async () => {
    serveSearch({});

    const { result } = renderHookWithProviders(() =>
      useInfiniteProducts("šećer"),
    );

    await waitFor(() => expect(result.current.total).toBe(1));
    expect(result.current.hasMatchesOutsideLocations).toBe(false);
  });

  it("reports none when a selected city failed to answer", async () => {
    serveSearch({}, true);

    const { result } = renderHookWithProviders(() =>
      useInfiniteProducts("šećer", inDakovo),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasPartialPriceData).toBe(true);
    expect(result.current.hasMatchesOutsideLocations).toBe(false);
  });
});

describe("useInfiniteProducts while the next search loads", () => {
  function serveSlowSugar() {
    server.use(
      http.get("*/api/cijene/products", async ({ request }) => {
        const q = new URL(request.url).searchParams.get("q");
        if (q !== "šećer") return HttpResponse.json({ products: [] });

        await delay(50);
        return HttpResponse.json({ products: [sugar] });
      }),
    );
  }

  it("keeps showing the previous results, marked as refreshing", async () => {
    serveSlowSugar();
    let q = "šećer";
    const { result, rerender } = renderHookWithProviders(() =>
      useInfiniteProducts(q),
    );
    await waitFor(() => expect(result.current.total).toBe(1));

    q = "šećer smeđi";
    rerender();

    expect(result.current.isRefreshing).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.visibleItems).toHaveLength(1);
  });

  it("stays loading when the previous search found nothing", async () => {
    serveSlowSugar();
    let q = "šećr";
    const { result, rerender } = renderHookWithProviders(() =>
      useInfiniteProducts(q),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.total).toBe(0);

    q = "šećer";
    rerender();

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.total).toBe(1));
    expect(result.current.isRefreshing).toBe(false);
  });
});
