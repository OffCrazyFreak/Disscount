import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import WatchlistClient from "@/app/[locale]/(user)/watchlist/components/watchlist-client";
import { renderWithProviders } from "@/test/render";

const data = vi.hoisted(() => ({
  canShowAccountData: true,
  shoppingListItemsLoading: false,
  filteredSuggestionItems: [] as { productApiId: string }[],
}));

vi.mock("@/app/[locale]/(user)/watchlist/hooks/use-watchlist-data", () => ({
  useWatchlistData: () => ({
    ...data,
    userLoading: false,
    watchlistLoading: false,
    hasWatchedProducts: true,
    hasPinnedStores: false,
    productsLoading: false,
    pricesUpdatedAt: 0,
    filteredItems: [],
    discountedItems: [],
  }),
}));

vi.mock("@/i18n/navigation", () => ({ usePathname: () => "/watchlist" }));

// The sections have their own data needs; this file covers only the section tabs.
vi.mock("@/components/custom/search/search-bar", () => ({
  default: () => null,
}));
vi.mock("@/app/[locale]/(user)/watchlist/components/watchlist-header", () => ({
  default: () => null,
}));
vi.mock("@/app/[locale]/(user)/watchlist/components/watchlist-list", () => ({
  default: () => null,
}));
vi.mock("@/components/custom/common/login-required", () => ({
  default: () => <p>login required</p>,
}));
vi.mock(
  "@/app/[locale]/(user)/watchlist/components/watchlist-suggestions",
  () => ({ default: () => <p>suggestions</p> }),
);

const NAV = { name: "Odjeljci praćenja" };

describe("WatchlistClient section tabs", () => {
  it("does not offer a suggestions tab while suggestions load", () => {
    data.shoppingListItemsLoading = true;
    data.filteredSuggestionItems = [];
    renderWithProviders(<WatchlistClient query="" />);

    expect(screen.queryByText("suggestions")).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist", NAV)).not.toBeInTheDocument();
  });

  it("offers the suggestions with their count once they arrive", () => {
    data.shoppingListItemsLoading = false;
    data.filteredSuggestionItems = [
      { productApiId: "a" },
      { productApiId: "b" },
    ];
    renderWithProviders(<WatchlistClient query="" />);

    const tabList = screen.getByRole("tablist", NAV);
    expect(
      within(tabList).getByRole("tab", { name: /Prijedlozi.* 2$/ }),
    ).toHaveAttribute("aria-selected", "false");
  });
});

describe("WatchlistClient offline", () => {
  it("shows the saved watchlist for an account the session check could not confirm", () => {
    data.canShowAccountData = true;
    renderWithProviders(<WatchlistClient query="" />);

    expect(screen.queryByText("login required")).not.toBeInTheDocument();
  });

  it("asks a signed-out visitor to log in", () => {
    data.canShowAccountData = false;
    renderWithProviders(<WatchlistClient query="" />);

    expect(screen.getByText("login required")).toBeInTheDocument();
    data.canShowAccountData = true;
  });
});
