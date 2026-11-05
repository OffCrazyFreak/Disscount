import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HeaderActions from "@/components/custom/header/components/header-actions";
import { renderWithProviders } from "@/test/render";

const account = vi.hoisted(() => ({ canShowAccountData: true }));

// Offline: the session check failed for the account this device's saved data belongs to.
vi.mock("@/context/user-context", () => ({
  useUser: () => ({
    isAuthenticated: false,
    isInitializing: false,
    ...account,
  }),
}));
vi.mock("@/components/custom/user-menu/user-menu", () => ({
  default: () => <p>user menu</p>,
}));
vi.mock("@/components/custom/notifications/notifications-dropdown", () => ({
  default: () => null,
}));
vi.mock("@/components/custom/locale/language-switcher", () => ({
  default: () => null,
}));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

describe("HeaderActions offline", () => {
  it("shows the account menu, not a login button, next to the account's saved data", () => {
    account.canShowAccountData = true;
    renderWithProviders(<HeaderActions />);

    expect(screen.getByText("user menu")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers the login once no account's data may be shown", () => {
    account.canShowAccountData = false;
    renderWithProviders(<HeaderActions />);

    expect(screen.queryByText("user menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
