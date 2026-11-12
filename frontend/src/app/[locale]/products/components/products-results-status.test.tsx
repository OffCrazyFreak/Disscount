import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ProductsResultsStatus from "@/app/[locale]/products/components/products-results-status";
import { renderWithProviders } from "@/test/render";

const SETTLED = {
  query: "mlijeko",
  isPending: false,
  hasError: false,
  isTruncated: false,
  noPriceLocations: [],
};

describe("ProductsResultsStatus", () => {
  it("announces the count with the Croatian plural and the search word", () => {
    renderWithProviders(<ProductsResultsStatus {...SETTLED} total={3} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      /^3 rezultata za "mlijeko"$/,
    );
  });

  it("reads a new search with the same count as a different message", () => {
    const { rerender } = renderWithProviders(
      <ProductsResultsStatus {...SETTLED} total={3} />,
    );
    const region = screen.getByRole("status");

    rerender(<ProductsResultsStatus {...SETTLED} query="sir" total={3} />);

    expect(screen.getByRole("status")).toBe(region);
    expect(region).toHaveTextContent(/^3 rezultata za "sir"$/);
  });

  it("says a capped count may be higher", () => {
    renderWithProviders(
      <ProductsResultsStatus {...SETTLED} total={100} isTruncated />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      /^100 rezultata ili više za "mlijeko"$/,
    );
  });

  it("never says an empty, capped search may have more", () => {
    renderWithProviders(
      <ProductsResultsStatus {...SETTLED} total={0} isTruncated />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      /^Nema rezultata za "mlijeko"$/,
    );
  });

  it("stays mounted but silent while the search loads", () => {
    renderWithProviders(
      <ProductsResultsStatus {...SETTLED} total={0} isPending />,
    );

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("announces which places have no price for a search found elsewhere", () => {
    renderWithProviders(
      <ProductsResultsStatus
        {...SETTLED}
        total={0}
        noPriceLocations={["Đakovo"]}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "nijedna trgovina u mjestu Đakovo nema objavljenu cijenu",
    );
  });
});
