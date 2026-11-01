import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PriceDropStatus from "@/components/custom/watchlist/price-drop-status";
import { renderWithProviders } from "@/test/render";

const drops = vi.hoisted(() => ({ count: 0 }));

// The count has its own tests; this one covers the announced wording.
vi.mock("@/lib/watchlist/use-watchlist-price-drop-count", () => ({
  useWatchlistPriceDropCount: () => drops.count,
}));

describe("PriceDropStatus", () => {
  it("announces the count with the Croatian plural", () => {
    drops.count = 3;
    renderWithProviders(<PriceDropStatus />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Praćenje, 3 nova sniženja",
    );
  });

  it("uses the Slovenian dual", () => {
    drops.count = 2;
    renderWithProviders(<PriceDropStatus />, { locale: "sl" });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Spremljanje, 2 novi znižanji",
    );
  });

  it("stays empty at zero so nothing is announced", () => {
    drops.count = 0;
    renderWithProviders(<PriceDropStatus />);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
