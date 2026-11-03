import { IsRestoringProvider } from "@tanstack/react-query";
import { screen, within } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it, vi } from "vitest";

import ShoppingListDetailClient from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-detail-client";
import type { ShoppingListDto } from "@/lib/api/types";
import { renderWithProviders } from "@/test/render";

const data = vi.hoisted(() => ({
  error: null as Error | null,
  shoppingList: undefined as ShoppingListDto | undefined,
  priceStates: {} as Record<string, string>,
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
  () => ({
    default: ({ hasFailedPrices }: { hasFailedPrices: boolean }) =>
      hasFailedPrices && <p>summary error</p>,
  }),
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
  it("does not call the list unavailable while the cache restores", () => {
    data.shoppingList = undefined;
    data.error = null;
    renderWithProviders(
      <IsRestoringProvider value>
        <ShoppingListDetailClient listId={LIST.id} />
      </IsRestoringProvider>,
    );

    expect(screen.queryByText("unavailable")).not.toBeInTheDocument();
  });

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

  it.each([
    [{ bought: "ready", unknown: "noPrices" }, false],
    [{ priced: "ready", broken: "failed" }, true],
  ])(
    "shows the store summary error only for a failed row (%o)",
    (priceStates, hasError) => {
      data.shoppingList = LIST;
      data.error = null;
      data.priceStates = priceStates;
      renderWithProviders(<ShoppingListDetailClient listId={LIST.id} />);

      expect(screen.queryByText("summary error") !== null).toBe(hasError);
    },
  );

  it("links only the sections an empty list has", () => {
    data.shoppingList = LIST;
    data.error = null;
    data.priceStates = {};
    renderWithProviders(<ShoppingListDetailClient listId={LIST.id} />);

    const nav = screen.getByRole("navigation", { name: "Odjeljci popisa" });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(["#products", "#stores"]);
  });

  it("adds the price history once the list has items", () => {
    data.shoppingList = {
      ...LIST,
      items: [{ id: "a", name: "Mlijeko", amount: 1, isChecked: false }],
    } as ShoppingListDto;
    data.error = null;
    data.priceStates = {};
    renderWithProviders(<ShoppingListDetailClient listId={LIST.id} />);

    const nav = screen.getByRole("navigation", { name: "Odjeljci popisa" });
    expect(within(nav).getAllByRole("link").at(-1)).toHaveAttribute(
      "href",
      "#price-history",
    );
  });
});
