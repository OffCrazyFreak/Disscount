import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BottomNavCenterItem from "@/components/custom/bottom-nav/bottom-nav-center-item";
import { ProductsSheetProvider } from "@/context/products-sheet-context";
import { renderWithProviders } from "@/test/render";

describe("BottomNavCenterItem", () => {
  // The raise is a transform, so it moves no layout: a ring outside the raised
  // circle stays centred on the unraised button.
  it("draws the hold ring on the raised green circle", () => {
    renderWithProviders(
      <ProductsSheetProvider>
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
        </ul>
      </ProductsSheetProvider>,
    );

    const button = screen.getByRole("button");
    const ring = button.querySelector("svg[viewBox='0 0 36 36']");
    const circle = ring?.parentElement;

    expect(circle).toHaveClass("bg-primary", "-translate-y-[0.2rem]");
    // Smaller than the 2.8rem circle, so the ring stays on its face.
    expect(ring).toHaveClass("stroke-primary-foreground", "size-[2.4rem]");
  });
});
