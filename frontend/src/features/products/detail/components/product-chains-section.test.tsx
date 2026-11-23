import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProductChainsSection from "@/features/products/detail/components/product-chains-section";
import type { useProductDetail } from "@/features/products/detail/hooks/use-product-detail";
import { chain, product } from "@/test/fixtures/price-fixtures";
import { renderWithProviders } from "@/test/render";

vi.mock("@/features/products/detail/components/store-item/store-item", () => ({
  default: () => null,
}));

vi.mock("@/components/custom/store-hours/use-store-hours-now", () => ({
  useStoreHoursNow: () => undefined,
}));

vi.mock("@/components/custom/distance-sort/distance-sort-note", () => ({
  default: () => null,
}));

function renderSection(chains: ReturnType<typeof chain>[]) {
  const detail = {
    sortedChains: chains,
    pricesByChain: {},
    pricesUpdatedAt: 0,
    sortBy: "price",
    setSortBy: () => {},
  } as unknown as ReturnType<typeof useProductDetail>;

  renderWithProviders(
    <ProductChainsSection
      product={product(chains)}
      detail={detail}
      today="2026-10-14"
    />,
  );
}

describe("ProductChainsSection", () => {
  it("says when the newest prices were published", () => {
    renderSection([
      { ...chain("konzum", 1), price_date: "2026-10-11" },
      { ...chain("lidl", 1.1), price_date: "2026-10-14" },
    ]);

    expect(
      screen.getByText("Cijene objavljene 14.10.2026."),
    ).toBeInTheDocument();
  });

  it("shows no date when no chain sells the product", () => {
    renderSection([]);

    expect(screen.queryByText(/Cijene objavljene/)).not.toBeInTheDocument();
  });
});
