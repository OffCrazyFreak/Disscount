import { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { useForm, useWatch } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { useAddToListPrices } from "@/app/[locale]/products/hooks/use-add-to-list-prices";
import type { AddToListFormData } from "@/app/[locale]/products/typings/add-to-list";
import cijeneService, { productByEanQueryKey } from "@/lib/cijene-api";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";

function chain(code: string, avgPrice: string) {
  return {
    chain: code,
    code: "1",
    name: "Šećer 1 kg",
    brand: "Viro",
    category: "Šećer",
    unit: "kg",
    quantity: "1",
    min_price: avgPrice,
    max_price: avgPrice,
    avg_price: avgPrice,
    price_date: "2026-11-01",
  };
}

const sugar: ProductResponse = {
  ean: "3850104004421",
  brand: "Viro",
  name: "Šećer 1 kg",
  quantity: "1",
  unit: "kg",
  chains: [chain("konzum", "1.40"), chain("spar", "1.20")],
};

function countProductRequests() {
  const counter = { requests: 0 };

  server.use(
    http.get(`*/api/cijene/products/${sugar.ean}`, () => {
      counter.requests += 1;
      return HttpResponse.json(sugar);
    }),
  );

  return counter;
}

// Mirrors useAddToListForm: the product comes from the shared React Query key.
function useHarness() {
  const { data: product } = cijeneService.useGetProductByEan({
    ean: sugar.ean,
  });
  const form = useForm<AddToListFormData>({
    defaultValues: { chainCode: null },
  });
  const pricing = useAddToListPrices(product, undefined, form);

  const chainCode = useWatch({ control: form.control, name: "chainCode" });

  return { pricing, chainCode };
}

describe("useAddToListPrices", () => {
  it("reuses a product already in the cache without another request", () => {
    const counter = countProductRequests();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(productByEanQueryKey(sugar.ean), sugar);

    const { result, rerender } = renderHookWithProviders(useHarness, {
      queryClient,
    });
    rerender();

    expect(result.current.pricing.storePrices).toEqual({
      konzum: 1.4,
      spar: 1.2,
    });
    expect(result.current.pricing.averagePrice).toBeCloseTo(1.3);
    expect(result.current.pricing.cheapestStore).toBe("spar");
    expect(result.current.chainCode).toBe("spar");
    expect(counter.requests).toBe(0);
  });

  it("fetches the product once when it is not cached yet", async () => {
    const counter = countProductRequests();

    const { result } = renderHookWithProviders(useHarness);

    await waitFor(() =>
      expect(result.current.pricing.cheapestStore).toBe("spar"),
    );
    expect(result.current.pricing.averagePrice).toBeCloseTo(1.3);
    expect(counter.requests).toBe(1);
  });
});
