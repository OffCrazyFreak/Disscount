import { IsRestoringProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ShoppingListsClient from "@/app/[locale]/(user)/shopping-lists/components/shopping-lists-client";
import type { ShoppingListDto } from "@/lib/api/types";
import { renderWithProviders } from "@/test/render";

const LIST: ShoppingListDto = {
  id: "5b0e6c1a-7d2f-4e8a-9c3b-1f4d6a8e2c70",
  title: "Tjedna kupnja",
  ownerId: "user-a",
  linkAccess: null,
  myAccess: "OWNER",
  updatedAt: "2026-11-01T10:00:00",
  createdAt: "2026-11-01T09:00:00",
  items: [],
};

const { saved } = vi.hoisted(() => ({ saved: { lists: true } }));

// Offline: the session check failed, and the lists saved on this device are this account's.
vi.mock("@/context/user-context", () => ({
  useUser: () => ({
    isAuthenticated: false,
    hasUnverifiedAccount: true,
    canShowAccountData: true,
    isLoading: false,
  }),
}));

vi.mock("@/lib/api", () => ({
  shoppingListService: {
    useGetCurrentUserShoppingLists: () =>
      saved.lists
        ? { data: [LIST], isLoading: false, isSuccess: true }
        : { data: undefined, isLoading: false, isSuccess: false },
  },
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/shopping-lists",
}));

// The page's own sections have their own data needs; this file covers the login gate.
vi.mock("@/components/custom/search/search-bar", () => ({
  default: () => null,
}));
vi.mock("@/components/custom/common/login-required", () => ({
  default: () => <p>login required</p>,
}));
vi.mock(
  "@/app/[locale]/(user)/shopping-lists/components/create-shopping-list-button",
  () => ({ default: () => null }),
);
vi.mock(
  "@/app/[locale]/(user)/shopping-lists/components/shopping-lists-results",
  () => ({
    default: ({
      isLoading,
      shoppingLists,
    }: {
      isLoading: boolean;
      shoppingLists: ShoppingListDto[];
    }) =>
      isLoading ? (
        <p>loading</p>
      ) : (
        shoppingLists.map((list) => <p key={list.id}>{list.title}</p>)
      ),
  }),
);

describe("ShoppingListsClient offline", () => {
  it("shows the saved lists for an account the session check could not confirm", () => {
    renderWithProviders(<ShoppingListsClient query="" />);

    expect(screen.getByText("Tjedna kupnja")).toBeInTheDocument();
    expect(screen.queryByText("login required")).not.toBeInTheDocument();
  });

  it("stays loading until the lists are read back from disk", () => {
    renderWithProviders(
      <IsRestoringProvider value>
        <ShoppingListsClient query="" />
      </IsRestoringProvider>,
    );

    expect(screen.getByText("loading")).toBeInTheDocument();
  });

  it("says the lists are not saved offline when this device never loaded them", () => {
    saved.lists = false;

    renderWithProviders(<ShoppingListsClient query="" />);

    saved.lists = true;
    expect(
      screen.getByText(/nije spremljena za korištenje bez interneta/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/0/)).not.toBeInTheDocument();
  });
});
