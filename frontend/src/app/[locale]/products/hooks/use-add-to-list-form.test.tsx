import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { useAddToListForm } from "@/app/[locale]/products/hooks/use-add-to-list-form";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { renderHookWithProviders } from "@/test/render";
import { chain } from "@/test/price-fixtures";

const SUGAR: ProductResponse = {
  ean: "3850104004421",
  brand: "Viro",
  name: "Šećer 1 kg",
  quantity: "1",
  unit: "kg",
  chains: [chain("spar", "1.20"), chain("konzum", "1.40")],
};

// Offline: the session check failed, so only the saved profile names the pinned stores.
vi.mock("@/context/user-context", () => ({
  useUser: () => ({
    user: null,
    accountUser: {
      pinnedStores: [{ storeApiId: "konzum", storeName: "Konzum Ilica" }],
    },
  }),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/products",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("useAddToListForm", () => {
  it("offline, suggests the cheapest of the saved profile's pinned chains", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(CIJENE_QUERY_KEYS.productByEan(SUGAR.ean), SUGAR);

    const { result } = renderHookWithProviders(
      () => useAddToListForm(true, SUGAR.ean),
      { queryClient },
    );

    expect(result.current.cheapestStore).toBe("konzum");
  });
});
