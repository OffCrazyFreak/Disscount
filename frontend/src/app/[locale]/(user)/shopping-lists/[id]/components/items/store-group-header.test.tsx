import type { ComponentProps } from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import StoreGroupHeader from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/store-group-header";
import type { ShoppingListItemDto } from "@/lib/api/types";
import { renderWithProviders } from "@/test/render";
import { UNSET_ITEM_FIELDS } from "@/test/unset-item-fields";

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ isAuthenticated: false }),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: ComponentProps<"a"> & { href: unknown }) => (
    <a href={String(href)} {...props} />
  ),
}));

function items(count: number): ShoppingListItemDto[] {
  return Array.from({ length: count }, (_, index) => ({
    ...UNSET_ITEM_FIELDS,
    id: `item-${index}`,
    name: `Stavka ${index}`,
    amount: 1,
    isChecked: false,
    shoppingListId: "list-1",
    createdAt: "2026-11-02T10:00:00",
  }));
}

describe("StoreGroupHeader", () => {
  it.each([
    [1, "1 stavka"],
    [3, "3 stavke"],
    [5, "5 stavki"],
  ])("counts %i items with no store as %s", (count, text) => {
    renderWithProviders(
      <StoreGroupHeader
        group={{
          chain: null,
          items: items(count),
          subtotal: 0,
          isPartial: true,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Ostalo" })).toBeInTheDocument();
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("keeps counting a store's group in products", () => {
    renderWithProviders(
      <StoreGroupHeader
        group={{
          chain: "konzum",
          items: items(3),
          subtotal: 4.5,
          isPartial: false,
        }}
      />,
    );

    expect(screen.getByText(/^3 proizvoda/)).toBeInTheDocument();
  });
});
