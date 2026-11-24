import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HeaderNavItem from "@/components/custom/header/components/header-nav-item";
import { findNavItem } from "@/constants/navigation";
import { renderWithProviders } from "@/test/render";

// Link needs a mounted App Router; a plain anchor keeps the accessible name under test.
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

describe("HeaderNavItem", () => {
  it("names the link with the count and hides the capped badge", () => {
    renderWithProviders(
      <HeaderNavItem
        item={findNavItem("watchlist")}
        pathname="/"
        badgeCount={3}
        badgeLabel="Praćenje, 3 nova sniženja"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Praćenje, 3 nova sniženja" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3")).toHaveAttribute("aria-hidden", "true");
  });
});
