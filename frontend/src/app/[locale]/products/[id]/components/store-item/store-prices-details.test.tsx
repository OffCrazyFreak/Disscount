import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import StorePricesDetails from "@/app/[locale]/products/[id]/components/store-item/store-prices-details";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { renderWithProviders } from "@/test/render";

vi.mock(
  "@/app/[locale]/products/[id]/components/store-item/store-prices-table",
  () => ({ default: () => <table aria-label="TABLE" /> }),
);

const product = { ean: "1", chains: [] } as unknown as ProductResponse;

describe("StorePricesDetails", () => {
  it("offline with no saved prices, shows one line instead of an empty table", () => {
    renderWithProviders(
      <StorePricesDetails
        storePrices={[]}
        status="offline"
        product={product}
      />,
    );

    expect(
      screen.getByText("Cijene nisu spremljene za rad bez interneta"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
