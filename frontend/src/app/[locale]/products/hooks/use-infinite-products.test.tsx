import { waitFor } from "@testing-library/react";
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
