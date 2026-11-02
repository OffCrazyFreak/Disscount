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
  it("announces the count with the Croatian plural", () => {
    renderWithProviders(<ProductsResultsStatus {...SETTLED} total={3} />);

    expect(screen.getByRole("status")).toHaveTextContent("3 rezultata");
  });

  it("says a capped count may be higher", () => {
    renderWithProviders(
      <ProductsResultsStatus {...SETTLED} total={100} isTruncated />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "100 rezultata ili više",
    );
  });

  it("never says an empty, capped search may have more", () => {
    renderWithProviders(
      <ProductsResultsStatus {...SETTLED} total={0} isTruncated />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(/^Nema rezultata$/);
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
