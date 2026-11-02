import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import ProductsResults from "@/app/[locale]/products/components/products-results";
import { renderWithProviders } from "@/test/render";

function renderEmptyResults(hasMatchesOutsideLocations: boolean) {
  const showAllLocations = vi.fn();
  const clearFilters = vi.fn();

  renderWithProviders(
    <ProductsResults
      query="šećer"
      isPending={false}
      isRefreshing={false}
      hasError={false}
      total={0}
      activeFilterCount={2}
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
