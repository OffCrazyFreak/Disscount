import { IsRestoringProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProductDetailClient from "@/app/[locale]/products/[id]/components/product-detail-client";
import { renderWithProviders } from "@/test/render";

// What useQuery reports while PersistQueryClientProvider restores: no data, idle, no error.
vi.mock("@/app/[locale]/products/[id]/hooks/use-product-detail", () => ({
  useProductDetail: () => ({
    product: undefined,
    productLoading: false,
    productError: null,
  }),
}));

const NOT_FOUND = "Proizvod nije pronađen";

describe("ProductDetailClient", () => {
  it("does not claim the product is missing while the cache restores", () => {
    renderWithProviders(
      <IsRestoringProvider value>
        <ProductDetailClient ean="5449000000996" />
      </IsRestoringProvider>,
    );

    expect(screen.queryByText(NOT_FOUND)).not.toBeInTheDocument();
  });

  it("says the product is missing once restoring is done", () => {
    renderWithProviders(<ProductDetailClient ean="5449000000996" />);

    expect(screen.getByText(NOT_FOUND)).toBeInTheDocument();
  });
});
