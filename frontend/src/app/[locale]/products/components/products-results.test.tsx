import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import ProductsResults from "@/app/[locale]/products/components/products-results";
import { renderWithProviders } from "@/test/render";

const { openModalUrl } = vi.hoisted(() => ({ openModalUrl: vi.fn() }));
vi.mock("@/lib/modal/modal-navigation", () => ({ openModalUrl }));

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
