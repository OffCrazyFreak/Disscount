import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ProductsResults from "@/app/[locale]/products/components/products-results";
import { renderWithProviders } from "@/test/render";

const { openModalUrl } = vi.hoisted(() => ({ openModalUrl: vi.fn() }));
vi.mock("@/lib/modal/modal-navigation", () => ({ openModalUrl }));

function renderEmptySearch(query: string, activeFilterCount = 0) {
  renderWithProviders(
    <ProductsResults
      query={query}
      isPending={false}
      hasError={false}
      total={0}
      activeFilterCount={activeFilterCount}
      clearFilters={() => {}}
      visibleItems={[]}
      viewMode="grid"
    />,
  );
}

describe("ProductsResults", () => {
  it("offers to add a search with no results to a list as a plain item", async () => {
    const user = userEvent.setup();
    renderEmptySearch(" staklenke ");

    await user.click(
      screen.getByRole("button", { name: "Dodaj „staklenke” na popis" }),
    );

    expect(openModalUrl).toHaveBeenCalledWith({
      name: "add-plain-item",
      itemName: "staklenke",
    });
  });

  it("asks to clear filters first when filters hide the results", () => {
    renderEmptySearch("staklenke", 1);

    expect(
      screen.queryByRole("button", { name: /na popis/ }),
    ).not.toBeInTheDocument();
  });
});
