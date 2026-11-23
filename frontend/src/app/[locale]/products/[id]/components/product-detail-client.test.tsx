import { IsRestoringProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProductDetailClient from "@/app/[locale]/products/[id]/components/product-detail-client";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { renderWithProviders } from "@/test/render";

const detail = vi.hoisted(() => ({
  product: undefined as ProductResponse | undefined,
  productLoading: false,
  productError: null as Error | null,
  productOffline: false,
  sortedChains: [],
}));

vi.mock("@/app/[locale]/products/[id]/hooks/use-product-detail", () => ({
  useProductDetail: () => detail,
}));

vi.mock("@/app/[locale]/products/components/product-info-display", () => ({
  default: ({ product }: { product: ProductResponse }) => <p>{product.name}</p>,
}));

vi.mock(
  "@/app/[locale]/products/[id]/components/product-chains-section",
  () => ({ default: () => null }),
);

vi.mock(
  "@/app/[locale]/products/[id]/components/price-history/price-history-base",
  () => ({ default: () => null }),
);

const NOT_FOUND = "Proizvod nije pronađen";
const TODAY = "2026-11-04";

describe("ProductDetailClient", () => {
  beforeEach(() => {
    // What useQuery reports while PersistQueryClientProvider restores: no data, idle, no error.
    detail.product = undefined;
    detail.productLoading = false;
    detail.productError = null;
    detail.productOffline = false;
  });

  it("does not claim the product is missing while the cache restores", () => {
    renderWithProviders(
      <IsRestoringProvider value>
        <ProductDetailClient ean="5449000000996" today={TODAY} />
      </IsRestoringProvider>,
    );

    expect(screen.queryByText(NOT_FOUND)).not.toBeInTheDocument();
  });

  it("says the product is missing once restoring is done", () => {
    renderWithProviders(
      <ProductDetailClient ean="5449000000996" today={TODAY} />,
    );

    expect(screen.getByText(NOT_FOUND)).toBeInTheDocument();
  });

  it("keeps the cached product when a background refetch fails", () => {
    detail.product = {
      ean: "5449000000996",
      name: "Coca-Cola",
      chains: [],
    } as unknown as ProductResponse;
    detail.productError = new Error("Network Error");

    renderWithProviders(
      <ProductDetailClient ean="5449000000996" today={TODAY} />,
    );

    expect(screen.getByText("Coca-Cola")).toBeInTheDocument();
    expect(screen.queryByText(NOT_FOUND)).not.toBeInTheDocument();
  });

  it("says the product is not saved when offline on a first visit", () => {
    detail.productOffline = true;

    renderWithProviders(
      <ProductDetailClient ean="5449000000996" today={TODAY} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Ova stranica još nije spremljena za korištenje bez interneta.",
    );
    expect(screen.queryByText(NOT_FOUND)).not.toBeInTheDocument();
  });
});
