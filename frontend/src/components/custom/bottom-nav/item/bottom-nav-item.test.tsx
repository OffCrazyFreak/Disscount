import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BottomNavItem from "@/components/custom/bottom-nav/item/bottom-nav-item";
import { findNavItem } from "@/constants/navigation";
import { renderWithProviders } from "@/test/render";

function renderCell(badgeCount?: number, accessibleName?: string) {
  renderWithProviders(
    <BottomNavItem
      entry={{ item: findNavItem("watchlist") }}
      isActive={false}
      isScrubbed={false}
      isLocked={false}
      badgeCount={badgeCount}
      accessibleName={accessibleName}
      showsDisc={false}
      indicatorOpacity={{ from: 1, to: 1 }}
      hasHold={false}
      onKeyboardActivate={() => {}}
    />,
  );
}

describe("BottomNavItem", () => {
  it("puts the exact count in the name and caps the visual badge at 9+", () => {
    renderCell(12, "Praćenje, 12 novih sniženja");

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

  it("names the return chevron, which is drawn only", () => {
    renderCell(undefined, "Praćenje, dodirni za povratak na prethodno mjesto");

    expect(
      screen.getByRole("button", {
        name: "Praćenje, dodirni za povratak na prethodno mjesto",
      }),
    ).toBeInTheDocument();
  });
});
