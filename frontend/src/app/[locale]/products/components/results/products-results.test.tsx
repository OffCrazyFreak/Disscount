import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import ProductsResults from "@/app/[locale]/products/components/results/products-results";
import { renderWithProviders } from "@/test/render";

const { openModalUrl } = vi.hoisted(() => ({ openModalUrl: vi.fn() }));
vi.mock("@/lib/modal/modal-navigation", () => ({ openModalUrl }));

// The cards need real products; these tests are about what follows them.
vi.mock("@/app/[locale]/products/components/results/products-grid", () => ({
  default: () => <ul aria-label="results" />,
}));

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
  });

  it("also offers to add the search as a plain item", async () => {
    const user = userEvent.setup();
    renderEmptyResults(true);

    await user.click(
      screen.getByRole("button", { name: "Dodaj „šećer” na popis" }),
    );

    expect(openModalUrl).toHaveBeenCalledWith({
      name: "add-plain-item",
      itemName: "šećer",
    });
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

  it("offers both clearing the filters and a plain item when filters hide the results", () => {
    renderEmptyResults(false, { activeFilterCount: 1 });

    expect(
      screen.getByRole("button", { name: "Očisti filtere" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Dodaj „šećer” na popis" }),
    ).toBeInTheDocument();
  });

  it("offers no plain item for a blank search", () => {
    renderEmptyResults(false, { query: "   ", activeFilterCount: 0 });

    expect(
      screen.queryByRole("button", { name: /na popis/ }),
    ).not.toBeInTheDocument();
  });
});

describe("ProductsResults at the end of the list", () => {
  beforeAll(() => {
    window.matchMedia ??= vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  function renderList(total: number, visible: number) {
    renderWithProviders(
      <ProductsResults
        query="mandarine"
        isPending={false}
        isRefreshing={false}
        hasError={false}
        total={total}
        activeFilterCount={0}
        clearFilters={vi.fn()}
        selectedLocations={[]}
        hasMatchesOutsideLocations={false}
        showAllLocations={vi.fn()}
        visibleItems={Array.from({ length: visible }, () => ({}) as never)}
        viewMode="grid"
      />,
    );
  }

  it("offers a plain item once every result is shown", async () => {
    const user = userEvent.setup();
    renderList(3, 3);

    expect(
      screen.getByText(
        "Ne vidiš što tražiš? Dodaj ga na popis pod svojim nazivom.",
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Dodaj „mandarine” na popis" }),
    );

    expect(openModalUrl).toHaveBeenCalledWith({
      name: "add-plain-item",
      itemName: "mandarine",
    });
  });

  it("waits for the last batch before offering a plain item", () => {
    renderList(60, 50);

    expect(
      screen.queryByRole("button", { name: /na popis/ }),
    ).not.toBeInTheDocument();
  });
});
