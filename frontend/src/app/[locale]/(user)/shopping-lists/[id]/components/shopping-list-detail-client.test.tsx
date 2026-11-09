import { IsRestoringProvider } from "@tanstack/react-query";
import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ShoppingListDetailClient from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-detail-client";
import type { ShoppingListDto } from "@/lib/api/types";
import { renderWithProviders } from "@/test/render";
import { UNSET_ITEM_FIELDS } from "@/test/unset-item-fields";
import { httpError } from "@/test/http-error";

const account = vi.hoisted(() => ({ canShowAccountData: false }));

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
  useUser: () => ({ isAuthenticated: false, ...account }),
}));

// The sections have their own data needs; this file covers only which screen shows.
vi.mock(
  "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-header",
  () => ({
    default: ({
      shoppingList,
      isSignedIn,
    }: {
      shoppingList: ShoppingListDto;
      isSignedIn: boolean;
    }) => (
      <>
        <h1>{shoppingList.title}</h1>
        {isSignedIn && <p>signed-in controls</p>}
      </>
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
  ownerId: null,
  linkAccess: null,
  myAccess: "SHOP",
  updatedAt: "2026-11-01T10:00:00",
  createdAt: "2026-11-01T09:00:00",
  items: [],
};

const LIST_WITH_ITEM = {
  ...LIST,
  items: [
    {
      ...UNSET_ITEM_FIELDS,
      id: "a",
      name: "Mlijeko",
      amount: 1,
      isChecked: false,
      shoppingListId: LIST.id,
      createdAt: "2026-11-01T09:30:00",
    },
  ],
} satisfies ShoppingListDto;

describe("ShoppingListDetailClient", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
    account.canShowAccountData = false;
  });

  it("keeps the signed-in controls offline for this device's account", () => {
    account.canShowAccountData = true;
    data.shoppingList = LIST;
    data.error = null;
    renderWithProviders(<ShoppingListDetailClient listId={LIST.id} />);

    expect(screen.getByText("signed-in controls")).toBeInTheDocument();
  });

  it("keeps a signed-out link visitor signed out", () => {
    data.shoppingList = LIST;
    data.error = null;
    renderWithProviders(<ShoppingListDetailClient listId={LIST.id} />);

    expect(screen.queryByText("signed-in controls")).not.toBeInTheDocument();
  });

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
      data.shoppingList = LIST_WITH_ITEM;
      data.error = null;
      data.priceStates = priceStates;
      // Only the open tab renders, and the summary lives on the stores tab.
      window.history.replaceState(null, "", "/#stores");
      renderWithProviders(<ShoppingListDetailClient listId={LIST.id} />);

      expect(screen.queryByText("summary error") !== null).toBe(hasError);
    },
  );

  it("shows no tabs for an empty list, which has only its products", () => {
    data.shoppingList = LIST;
    data.error = null;
    data.priceStates = {};
    renderWithProviders(<ShoppingListDetailClient listId={LIST.id} />);

    expect(
      screen.queryByRole("tablist", { name: "Odjeljci popisa" }),
    ).not.toBeInTheDocument();
  });

  it("offers products, stores and price history once the list has items", () => {
    data.shoppingList = LIST_WITH_ITEM;
    data.error = null;
    data.priceStates = {};
    renderWithProviders(<ShoppingListDetailClient listId={LIST.id} />);

    const tabList = screen.getByRole("tablist", { name: "Odjeljci popisa" });
    const names = within(tabList)
      .getAllByRole("tab")
      .map((tab) => tab.textContent);
    expect(names).toEqual([
      expect.stringMatching(/^Proizvodi/),
      expect.stringMatching(/^Trgovine/),
      expect.stringMatching(/^Povijest/),
    ]);
  });
});
