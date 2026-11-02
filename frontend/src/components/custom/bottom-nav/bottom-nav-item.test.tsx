import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BottomNavItem from "@/components/custom/bottom-nav/bottom-nav-item";
import { findNavItem } from "@/constants/navigation";
import { renderWithProviders } from "@/test/render";

function renderCell(badgeCount?: number) {
  renderWithProviders(
    <BottomNavItem
      entry={{ item: findNavItem("watchlist") }}
      isActive={false}
      isScrubbed={false}
      isLocked={false}
      badgeCount={badgeCount}
      badgeLabel="Praćenje, 12 novih sniženja"
      showsDisc={false}
      indicatorOpacity={{ from: 1, to: 1 }}
      hasHold={false}
      onKeyboardActivate={() => {}}
    />,
  );
}

describe("BottomNavItem", () => {
  it("puts the exact count in the name and caps the visual badge at 9+", () => {
    renderCell(12);

    expect(
      screen.getByRole("button", { name: "Praćenje, 12 novih sniženja" }),
    ).toBeInTheDocument();
    expect(screen.getByText("9+")).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the plain label without a count", () => {
    renderCell(undefined);

    expect(
      screen.getByRole("button", { name: "Praćenje" }),
    ).toBeInTheDocument();
  });
});
