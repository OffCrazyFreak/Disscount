import { QueryClient, hydrate } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { productCacheState } from "@/app/[locale]/products/[id]/utils/product-cache-state";
import cijeneService from "@/lib/cijene-api";
import type {
  ProductResponse,
  StorePricesResponse,
} from "@/lib/cijene-api/schemas";
import { renderHookWithProviders } from "@/test/render";

vi.mock("server-only", () => ({}));

const EAN = "5449000000996";

const product: ProductResponse = {
  ean: EAN,
  brand: "Coca-Cola",
  name: "Coca-Cola 0,5 l",
  quantity: "0.5",
  unit: "l",
  chains: [
    {
      chain: "konzum",
      code: "123",
      name: "Coca-Cola 0,5 l",
      brand: "Coca-Cola",
      category: null,
      unit: "l",
      quantity: "0.5",
      min_price: "1.29",
      max_price: "1.49",
      avg_price: "1.39",
      price_date: "2026-11-02",
    },
  ],
};

// Empty is enough: the test checks the key lines up, not the rows.
const prices: StorePricesResponse = { store_prices: [] };

function hydratedClient(state: ReturnType<typeof productCacheState>) {
  const queryClient = new QueryClient();
  hydrate(queryClient, state);
  return queryClient;
}

describe("productCacheState", () => {
  it("seeds the exact keys the product page queries, so it fetches nothing", () => {
    const queryClient = hydratedClient(productCacheState(EAN, product, prices));

    const { result } = renderHookWithProviders(
      () => ({
        product: cijeneService.useGetProductByEan({ ean: EAN }),
        prices: cijeneService.useGetPrices({ eans: EAN }),
      }),
      { queryClient },
    );

    expect(result.current.product.data).toEqual(product);
    expect(result.current.product.isFetching).toBe(false);
    expect(result.current.prices.data).toEqual(prices);
    expect(result.current.prices.isFetching).toBe(false);
  });

  it("leaves the prices to the browser when the server could not load them", () => {
    const queryClient = hydratedClient(productCacheState(EAN, product, null));

    expect(
      queryClient.getQueryData([
        "cijene",
        "product",
        "ean",
        `{"ean":"${EAN}"}`,
      ]),
    ).toEqual(product);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1);
  });
});
