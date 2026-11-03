import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import WatchlistClient from "@/app/[locale]/(user)/watchlist/components/watchlist-client";
import { renderWithProviders } from "@/test/render";

const data = vi.hoisted(() => ({
  shoppingListItemsLoading: false,
  filteredSuggestionItems: [] as { productApiId: string }[],
}));

vi.mock("@/app/[locale]/(user)/watchlist/hooks/use-watchlist-data", () => ({
  useWatchlistData: () => ({
    ...data,
    isAuthenticated: true,
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

// The sections have their own data needs; this file covers only the section bar.
vi.mock("@/components/custom/search/search-bar", () => ({
  default: () => null,
}));
vi.mock("@/app/[locale]/(user)/watchlist/components/watchlist-header", () => ({
  default: () => null,
}));
vi.mock("@/app/[locale]/(user)/watchlist/components/watchlist-list", () => ({
  default: () => null,
}));
vi.mock(
  "@/app/[locale]/(user)/watchlist/components/watchlist-suggestions",
  () => ({ default: () => <p>suggestions</p> }),
);

const NAV = { name: "Odjeljci praćenja" };

describe("WatchlistClient section bar", () => {
  it("does not offer a suggestions link while suggestions load", () => {
    data.shoppingListItemsLoading = true;
    data.filteredSuggestionItems = [];
    renderWithProviders(<WatchlistClient query="" />);

    expect(screen.getByText("suggestions")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", NAV)).not.toBeInTheDocument();
  });

  it("links the suggestions with their count once they arrive", () => {
    data.shoppingListItemsLoading = false;
    data.filteredSuggestionItems = [
      { productApiId: "a" },
      { productApiId: "b" },
    ];
    renderWithProviders(<WatchlistClient query="" />);

    const nav = screen.getByRole("navigation", NAV);
    expect(
      within(nav).getByRole("link", { name: /Prijedlozi.* 2$/ }),
    ).toHaveAttribute("href", "#suggestions");
  });
});
