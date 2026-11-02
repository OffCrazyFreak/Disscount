import type { ComponentProps } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ShoppingListItems from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-items";
import type { ItemPriceState } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/item-price-state";
import type { ShoppingListDto, ShoppingListItemDto } from "@/lib/api/types";
import { renderWithProviders } from "@/test/render";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props} />
  ),
}));

// Radix measures the select trigger, and jsdom has no ResizeObserver.
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

function item(id: string, extra: Partial<ShoppingListItemDto> = {}) {
  return {
    id,
    ean: id,
    name: id,
    amount: 1,
    isChecked: false,
    shoppingListId: "list-1",
    createdAt: "2026-10-27T00:00:00",
    ...extra,
  } satisfies ShoppingListItemDto;
}

function renderItems(
  items: ShoppingListItemDto[],
  priceStates: Record<string, ItemPriceState>,
  onRetryPrices = vi.fn(async () => true),
) {
  const view = renderWithProviders(
    listItems(items, priceStates, onRetryPrices),
  );

  return { onRetryPrices, rerender: view.rerender };
}

function listItems(
  items: ShoppingListItemDto[],
  priceStates: Record<string, ItemPriceState>,
  onRetryPrices = vi.fn(async () => true),
) {
  const list: ShoppingListDto = {
    id: "list-1",
    title: "Tjedni",
    myAccess: "OWNER",
    createdAt: "2026-10-27T00:00:00",
    updatedAt: "2026-10-27T00:00:00",
    items,
  };

  return (
    <ShoppingListItems
      shoppingList={list}
      cheapestStores={{}}
      isPricesLoading={false}
      averagePrices={{}}
      storePrices={{}}
      priceStates={priceStates}
      isRetryingPrices={false}
      onRetryPrices={onRetryPrices}
    />
  );
}

describe("ShoppingListItems price states", () => {
  it("says why each store select is unavailable, and keeps it focusable", () => {
    renderItems([item("a"), item("b"), item("c")], {
      a: "failed",
      b: "offline",
      c: "noPrices",
    });

    // Rows sort by name, so the selects come back as a, b, c.
    const [failed, offline, noPrices] = screen.getAllByRole("combobox");

    expect(failed).toHaveAccessibleName("Trgovina Cijene nisu dostupne");
    expect(failed).toHaveAccessibleDescription(
      "Cijene za 1 stavku nisu dostupne.",
    );

    expect(offline).toHaveAccessibleName(
      "Trgovina Cijene nisu spremljene za izvanmrežni rad",
    );
    expect(offline).toHaveAccessibleDescription("");

    expect(noPrices).toHaveAccessibleName("Trgovina Nema cijena u trgovinama");

    for (const select of [failed, offline, noPrices]) {
      expect(select).toHaveAttribute("aria-disabled", "true");
      expect(select).not.toBeDisabled();
    }
  });

  it.each(["noPrices", "failed"] as const)(
    "does not open a %s select from the keyboard",
    async (priceState) => {
      const user = userEvent.setup();
      renderItems([item("a")], { a: priceState });

      screen.getByRole("combobox").focus();
      await user.keyboard("{Enter}{ArrowDown} ");

      expect(screen.getByRole("combobox")).toHaveFocus();
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    },
  );

  it("counts failed items in one status with one retry", async () => {
    const user = userEvent.setup();
    const { onRetryPrices: onRetry } = renderItems(
      [item("a"), item("b"), item("c")],
      {
        a: "failed",
        b: "failed",
        c: "ready",
      },
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Cijene za 2 stavke nisu dostupne.",
    );

    await user.click(screen.getByRole("button", { name: "Pokušaj ponovno" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows no empty price beside an unavailable store select", () => {
    renderItems([item("a", { quantity: "1", unit: "kg" })], { a: "noPrices" });

    expect(screen.queryByText(/~/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\/kg/)).not.toBeInTheDocument();
  });

  it("keeps the reason visible next to a store the item already has", () => {
    renderItems([item("a", { chainCode: "konzum" })], { a: "offline" });

    expect(screen.getByRole("combobox")).toHaveTextContent(
      "Konzum: Cijene nisu spremljene za izvanmrežni rad",
    );
  });

  it("moves focus to the outcome when a retry loads every price", async () => {
    const user = userEvent.setup();
    const items = [item("a")];
    const { rerender } = renderItems(items, { a: "failed" });

    await user.click(screen.getByRole("button", { name: "Pokušaj ponovno" }));
    rerender(listItems(items, { a: "ready" }));

    expect(screen.getByText("Cijene su učitane.")).toHaveFocus();
  });

  it("claims nothing when a retry fails and the failed item is removed", async () => {
    const user = userEvent.setup();
    const { rerender } = renderItems(
      [item("a"), item("b")],
      { a: "failed", b: "ready" },
      vi.fn(async () => false),
    );

    await user.click(screen.getByRole("button", { name: "Pokušaj ponovno" }));
    rerender(listItems([item("b")], { b: "ready" }));

    expect(screen.queryByText("Cijene su učitane.")).not.toBeInTheDocument();
  });

  it("retires the success line once a new failure appears", async () => {
    const user = userEvent.setup();
    const { rerender } = renderItems([item("a")], { a: "failed" });

    await user.click(screen.getByRole("button", { name: "Pokušaj ponovno" }));
    rerender(listItems([item("a")], { a: "ready" }));
    expect(screen.getByText("Cijene su učitane.")).toBeInTheDocument();

    rerender(listItems([item("a"), item("b")], { a: "ready", b: "failed" }));
    rerender(listItems([item("a")], { a: "ready" }));

    expect(screen.queryByText("Cijene su učitane.")).not.toBeInTheDocument();
  });

  it("shows a skeleton instead of a store select while prices load", () => {
    renderItems([item("a")], { a: "loading" });

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
