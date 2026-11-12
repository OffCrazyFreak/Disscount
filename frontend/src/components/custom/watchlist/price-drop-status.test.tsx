import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PriceDropStatus from "@/components/custom/watchlist/price-drop-status";
import { renderWithProviders } from "@/test/render";

const drops = vi.hoisted(() => ({ count: 0, isSettled: false }));
const session = vi.hoisted(() => ({ userId: "a" }));

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ user: { id: session.userId } }),
}));

// The count has its own tests; this one covers when and how it is announced.
vi.mock("@/lib/watchlist/use-watchlist-price-drop-count", () => ({
  useWatchlistPriceDropCount: () => ({ ...drops }),
}));

function renderSettledAt(count: number, locale?: "sl") {
  Object.assign(drops, { count, isSettled: true });
  session.userId = "a";
  return renderWithProviders(<PriceDropStatus />, { locale });
}

describe("PriceDropStatus", () => {
  it("stays quiet about the count the app loaded with", () => {
    renderSettledAt(3);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("announces a later change with the Croatian plural", () => {
    const { rerender } = renderSettledAt(1);

    drops.count = 3;
    rerender(<PriceDropStatus />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Praćenje, 3 nova popusta",
    );
  });

  it("uses the Slovenian dual", () => {
    const { rerender } = renderSettledAt(0, "sl");

    drops.count = 2;
    rerender(<PriceDropStatus />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Spremljanje, 2 nova popusta",
    );
  });

  it("waits for the count to settle before taking its baseline", () => {
    Object.assign(drops, { count: 0, isSettled: false });
    const { rerender } = renderWithProviders(<PriceDropStatus />);

    Object.assign(drops, { count: 2, isSettled: true });
    rerender(<PriceDropStatus />);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("takes a new baseline when another account signs in", () => {
    const { rerender } = renderSettledAt(2);

    session.userId = "b";
    drops.count = 3;
    rerender(<PriceDropStatus />);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("speaks only settled counts, not each price as it arrives", () => {
    const { rerender } = renderSettledAt(1);

    Object.assign(drops, { count: 2, isSettled: true });
    rerender(<PriceDropStatus />);
    Object.assign(drops, { count: 3, isSettled: false });
    rerender(<PriceDropStatus />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Praćenje, 2 nova popusta",
    );
  });

  it("empties at zero so nothing is announced", () => {
    const { rerender } = renderSettledAt(2);

    drops.count = 0;
    rerender(<PriceDropStatus />);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
