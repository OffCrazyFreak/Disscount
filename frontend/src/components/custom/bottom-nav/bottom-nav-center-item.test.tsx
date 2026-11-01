import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import BottomNavCenterItem from "@/components/custom/bottom-nav/bottom-nav-center-item";
import { renderWithProviders } from "@/test/render";

vi.mock("@/context/products-sheet-context", () => ({
  useProductsSheet: () => ({ triggerRef: { current: null } }),
}));

describe("BottomNavCenterItem", () => {
  // The raise is a transform, so it moves no layout: anything outside the raised
  // element stays centred on the unraised button.
  it("raises the hold ring together with the green circle", () => {
    renderWithProviders(
      <ul>
        <BottomNavCenterItem
          label="Proizvodi"
          isActive={false}
          isScrubbed={false}
          showsDisc={false}
          isSearchOpen={false}
          indicatorOpacity={{ from: 0, to: 0 }}
          onKeyboardActivate={() => {}}
        />
      </ul>,
    );

    const button = screen.getByRole("button");
    const ring = button.querySelector("svg[viewBox='0 0 36 36']");
    const circle = button.querySelector(".bg-primary");
    const raised = ring?.parentElement;

    expect(raised).not.toBe(button);
    expect(raised).toHaveClass("-translate-y-[0.2rem]");
    expect(raised).toContainElement(circle as HTMLElement);
    expect(circle).not.toHaveClass("-translate-y-[0.2rem]");
  });
});
