import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import ProductsClient from "@/app/[locale]/products/components/products-client";
import ProductsResults from "@/app/[locale]/products/components/products-results";
import { productSearchDraft } from "@/components/custom/search/search-draft-store";
import { renderWithProviders } from "@/test/render";

const { openModalUrl } = vi.hoisted(() => ({ openModalUrl: vi.fn() }));
vi.mock("@/lib/modal/modal-navigation", () => ({ openModalUrl }));

const { infiniteProducts } = vi.hoisted(() => ({
  infiniteProducts: vi.fn(() => ({
    visibleItems: [],
    total: 0,
    isTruncated: false,
    isLoading: false,
    isRefreshing: false,
    error: null,
    hasPartialPriceData: false,
    hasMatchesOutsideLocations: false,
  })),
}));
vi.mock("@/app/[locale]/products/hooks/use-infinite-products", () => ({
  default: infiniteProducts,
}));
vi.mock("@/app/[locale]/products/hooks/use-product-filters", () => ({
  default: () => ({
    selectedChains: [],
    selectedCategories: [],
    selectedBrands: [],
    selectedLocations: [],
    selectedSourceCities: [],
    allowedChains: null,
    locationsReady: true,
    locationsError: null,
    activeFilterCount: 0,
    clearFilters: vi.fn(),
    setFilter: vi.fn(),
  }),
}));
vi.mock("@/app/[locale]/products/components/product-filters-bar", () => ({
  default: () => null,
}));
vi.mock("@/components/custom/search/product-search-bar", () => ({
  default: () => null,
}));
vi.mock("@/components/custom/search/use-record-product-search", () => ({
  useRecordProductSearch: vi.fn(),
}));
vi.mock("@/components/custom/fab/scroll-cue", () => ({ default: () => null }));
vi.mock("@/i18n/navigation", () => ({ usePathname: () => "/products" }));

function renderEmptyResults(
  hasMatchesOutsideLocations: boolean,
  { query = "šećer", activeFilterCount = 2 } = {},
) {
  const showAllLocations = vi.fn();
  const clearFilters = vi.fn();

  renderWithProviders(
    <ProductsResults
      query={query}
      isPending={false}
      isRefreshing={false}
      hasError={false}
      total={0}
      activeFilterCount={activeFilterCount}
      clearFilters={clearFilters}
      selectedLocations={["Đakovo", "Osijek"]}
      hasMatchesOutsideLocations={hasMatchesOutsideLocations}
      showAllLocations={showAllLocations}
      visibleItems={[]}
      viewMode="grid"
    />,
  );

  return { showAllLocations, clearFilters };
}

describe("ProductsResults with no price in the selected places", () => {
  it("names the places and offers prices across Croatia", async () => {
    const user = userEvent.setup();
    const { showAllLocations, clearFilters } = renderEmptyResults(true);

    expect(
      screen.getByText("Nema cijena u odabranim mjestima"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /nijedna trgovina u mjestima Đakovo i Osijek nema objavljenu cijenu/,
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Prikaži cijene u cijeloj Hrvatskoj",
      }),
    );

    expect(showAllLocations).toHaveBeenCalledOnce();
    expect(clearFilters).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: /na popis/ }),
    ).not.toBeInTheDocument();
  });

  it("keeps the generic filter message when nothing matches anywhere", () => {
    renderEmptyResults(false);

    expect(
      screen.getByText("Nema rezultata za odabrane filtere"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Prikaži cijene u cijeloj Hrvatskoj",
      }),
    ).not.toBeInTheDocument();
  });
});

describe("ProductsResults while the next search loads", () => {
  beforeAll(() => {
    // jsdom has no matchMedia; the grid asks it for the mobile breakpoint.
    window.matchMedia ??= vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it("marks the previous results as busy", () => {
    const { container } = renderWithProviders(
      <ProductsResults
        query="šećer"
        isPending={false}
        isRefreshing={true}
        hasError={false}
        total={1}
        activeFilterCount={0}
        clearFilters={vi.fn()}
        selectedLocations={[]}
        hasMatchesOutsideLocations={false}
        showAllLocations={vi.fn()}
        visibleItems={[]}
        viewMode="grid"
      />,
    );

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });
});

describe("ProductsResults with no match at all", () => {
  it("offers to add the search to a list as a plain item", async () => {
    const user = userEvent.setup();
    renderEmptyResults(false, { query: " staklenke ", activeFilterCount: 0 });

    await user.click(
      screen.getByRole("button", { name: "Dodaj „staklenke” na popis" }),
    );

    expect(openModalUrl).toHaveBeenCalledWith({
      name: "add-plain-item",
      itemName: "staklenke",
    });
  });

  it("asks to clear filters first when filters hide the results", () => {
    renderEmptyResults(false, { activeFilterCount: 1 });

    expect(
      screen.queryByRole("button", { name: /na popis/ }),
    ).not.toBeInTheDocument();
  });
});

describe("ProductsClient with a short query", () => {
  it("asks for three characters while fewer are typed", () => {
    const hint = "Upiši barem 3 znaka za bolje rezultate.";
    renderWithProviders(<ProductsClient query="" />);
    expect(screen.queryByText(hint)).toBeNull();

    act(() => productSearchDraft.type("ml"));
    expect(screen.getByText(hint)).toHaveAttribute("role", "status");

    act(() => productSearchDraft.type("mli"));
    expect(screen.queryByText(hint)).toBeNull();
    act(() => productSearchDraft.clear());
  });

  it("shows the start screen instead of no results for a one-letter link", () => {
    renderWithProviders(<ProductsClient query="m" />);

    expect(infiniteProducts).toHaveBeenLastCalledWith("", expect.anything());
    expect(screen.getByText("Pretraži proizvode")).toBeInTheDocument();
    expect(screen.queryByText(/Dodaj/)).toBeNull();
  });
});
