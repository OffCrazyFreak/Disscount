import { screen } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it, vi } from "vitest";

import ShoppingListDetailClient from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-detail-client";
import type { ShoppingListDto } from "@/lib/api/types";
import { renderWithProviders } from "@/test/render";

const data = vi.hoisted(() => ({
  error: null as Error | null,
  shoppingList: undefined as ShoppingListDto | undefined,
}));

vi.mock(
  "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-shopping-list-data",
  () => ({
    useShoppingListData: () => ({
      ...data,
      isLoading: false,
      refetch: vi.fn(),
      listUpdatedAt: 0,
      cheapestStores: {},
      averagePrices: {},
      storePrices: {},
      isPricesLoading: false,
    }),
  }),
);

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ isAuthenticated: false }),
}));

// The sections have their own data needs; this file covers only which screen shows.
vi.mock(
  "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-header",
  () => ({
    default: ({ shoppingList }: { shoppingList: ShoppingListDto }) => (
      <h1>{shoppingList.title}</h1>
    ),
  }),
);
vi.mock(
  "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-access-banner",
  () => ({ default: () => null }),
);
vi.mock(
  "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-info-table",
  () => ({ default: () => null }),
);
vi.mock(
  "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-items",
  () => ({ default: () => null }),
);
vi.mock(
  "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-price-history",
  () => ({ default: () => null }),
);
vi.mock(
  "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/shopping-list-stores-list",
  () => ({ default: () => null }),
);
vi.mock(
  "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-unavailable",
  () => ({
    default: () => <p>unavailable</p>,
  }),
);

const LIST: ShoppingListDto = {
  id: "5b0e6c1a-7d2f-4e8a-9c3b-1f4d6a8e2c70",
  title: "Tjedna kupnja",
  linkAccess: null,
  myAccess: "SHOP",
  updatedAt: "2026-11-01T10:00:00",
  createdAt: "2026-11-01T09:00:00",
  items: [],
};

function httpError(status: number) {
  return new AxiosError("Request failed", undefined, undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { status },
  });
}

describe("ShoppingListDetailClient", () => {
  it("keeps the list on screen when a background refetch fails", () => {
    data.shoppingList = LIST;
    data.error = httpError(503);
    renderWithProviders(<ShoppingListDetailClient listId={LIST.id} />);

    expect(
      screen.getByRole("heading", { name: "Tjedna kupnja" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("unavailable")).not.toBeInTheDocument();
  });

  it("swaps a cached list for the unavailable screen once it is gone", () => {
    data.shoppingList = LIST;
    data.error = httpError(404);
    renderWithProviders(<ShoppingListDetailClient listId={LIST.id} />);

    expect(screen.getByText("unavailable")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
