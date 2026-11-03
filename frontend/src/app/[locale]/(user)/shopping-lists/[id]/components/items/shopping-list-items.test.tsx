import type { ReactNode } from "react";
import type { ComponentProps } from "react";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ShoppingListItems from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-items";
import type { ItemPriceState } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/item-price-state";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import type { ShoppingListDto, ShoppingListItemDto } from "@/lib/api/types";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";
import { UNSET_ITEM_FIELDS } from "@/test/unset-item-fields";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props} />
  ),
}));

// The store groups' headers read the session; this file tests the rows under them.
vi.mock("@/context/user-context", () => ({
  useUser: () => ({ isAuthenticated: false }),
}));

// The owner's quick add field is a combobox with its own status line; it has its own tests.
vi.mock(
  "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-quick-add",
  () => ({ default: () => null }),
);

// Radix measures the select trigger, and jsdom has no ResizeObserver.
// Every row also asks for its photo; ProductThumbnail has its own tests.
beforeEach(() => {
  server.use(
    http.get("*/api/products/images/thumbnails", () =>
      HttpResponse.json({ thumbnails: {} }),
    ),
  );
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
    ...UNSET_ITEM_FIELDS,
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

  return { onRetryPrices, rerender: view.rerender, container: view.container };
}

interface IListPrices {
  cheapestStores?: Record<string, string>;
  storePrices?: Record<string, Record<string, number>>;
  myAccess?: ShoppingListDto["myAccess"];
}

function listItems(
  items: ShoppingListItemDto[],
  priceStates: Record<string, ItemPriceState>,
  onRetryPrices = vi.fn(async () => true),
  {
    cheapestStores = {},
    storePrices = {},
    myAccess = "OWNER",
  }: IListPrices = {},
) {
  const list: ShoppingListDto = {
    id: "list-1",
    title: "Tjedni",
    ownerId: null,
    linkAccess: null,
    myAccess,
    createdAt: "2026-10-27T00:00:00",
    updatedAt: "2026-10-27T00:00:00",
    items,
  };

  return (
    <ShoppingListItems
      shoppingList={list}
      cheapestStores={cheapestStores}
      isPricesLoading={false}
      averagePrices={{}}
      storePrices={storePrices}
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
      "Trgovina Cijene nisu spremljene za rad bez interneta",
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
      "Konzum: Cijene nisu spremljene za rad bez interneta",
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

  it("claims nothing for a retry that a newer failure overtook", async () => {
    const user = userEvent.setup();
    let finishRetry: (loadedAll: boolean) => void = () => {};
    const onRetry = vi.fn(
      () => new Promise<boolean>((resolve) => (finishRetry = resolve)),
    );
    const { rerender } = renderItems([item("a")], { a: "failed" }, onRetry);

    await user.click(screen.getByRole("button", { name: "Pokušaj ponovno" }));
    rerender(
      listItems([item("a"), item("b")], { a: "failed", b: "failed" }, onRetry),
    );
    await act(async () => finishRetry(true));
    rerender(listItems([item("a")], { a: "ready" }, onRetry));

    expect(screen.queryByText("Cijene su učitane.")).not.toBeInTheDocument();
  });

  it("shows a skeleton instead of a store select while prices load", () => {
    renderItems([item("a")], { a: "loading" });

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("shows a plain item as having no price, with no store select or skeleton", () => {
    // A plain item has no lookup, so useShoppingListData gives it no price state.
    const { container } = renderItems([item("staklenke", { ean: null })], {});

    expect(screen.getByText("Bez cijene")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /staklenke/ })).toBeNull();
    expect(container.querySelector('[data-slot="skeleton"]')).toBeNull();
  });
});

describe("ShoppingListItems focus", () => {
  const konzumPrices: IListPrices = {
    cheapestStores: { a: "konzum" },
    storePrices: { a: { konzum: 1.5 } },
  };

  it("keeps focus on a row's store select when its prices turn ready", () => {
    const items = [item("a")];
    const { rerender } = renderItems(items, { a: "failed" });

    screen.getByRole("combobox").focus();
    rerender(listItems(items, { a: "ready" }, undefined, konzumPrices));

    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("moves a viewer's focus to the item name, since their live select is disabled", () => {
    const items = [item("a")];
    const viewer: IListPrices = { ...konzumPrices, myAccess: "VIEW" };
    const { rerender } = renderWithProviders(
      listItems(items, { a: "failed" }, undefined, { myAccess: "VIEW" }),
    );

    screen.getByRole("combobox").focus();
    rerender(listItems(items, { a: "ready" }, undefined, viewer));

    expect(screen.getByRole("link", { name: "a" })).toHaveFocus();
  });

  it("keeps focus on the row when it moves into its store's group", async () => {
    const user = userEvent.setup();
    const items = [item("a")];
    const { rerender } = renderItems(items, { a: "failed" });

    await user.click(screen.getByRole("switch"));
    screen.getByRole("combobox").focus();
    rerender(listItems(items, { a: "ready" }, undefined, konzumPrices));

    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("hands focus to the retried row when a retry ends in no prices", async () => {
    const user = userEvent.setup();
    const items = [item("a")];
    const onRetry = vi.fn(async () => false);
    const { rerender } = renderItems(items, { a: "failed" }, onRetry);

    await user.click(screen.getByRole("button", { name: "Pokušaj ponovno" }));
    rerender(listItems(items, { a: "noPrices" }, onRetry));

    await waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());
  });

  it("focuses the items tab panel when the retried row is gone", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn(async () => false);
    // On the page the items sit in a tab panel; this stands in for it.
    const inPanel = (children: ReactNode) => (
      <div role="tabpanel" aria-label="Proizvodi" tabIndex={0}>
        {children}
      </div>
    );
    const view = renderWithProviders(
      inPanel(listItems([item("a")], { a: "failed" }, onRetry)),
    );

    await user.click(screen.getByRole("button", { name: "Pokušaj ponovno" }));
    view.rerender(inPanel(listItems([item("b")], { b: "ready" }, onRetry)));

    await waitFor(() =>
      expect(screen.getByRole("tabpanel", { name: "Proizvodi" })).toHaveFocus(),
    );
  });

  it("focuses the items section when no tab panel is left", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn(async () => false);
    const view = renderWithProviders(
      listItems([item("a")], { a: "failed" }, onRetry),
    );

    await user.click(screen.getByRole("button", { name: "Pokušaj ponovno" }));
    view.rerender(listItems([], {}, onRetry));

    // A list left with only its products renders no tab panel around them.
    await waitFor(() =>
      expect(document.activeElement).toHaveAttribute("tabindex", "-1"),
    );
  });

  it("leaves focus alone when the retry button no longer had it", async () => {
    const user = userEvent.setup();
    const items = [item("a")];
    const onRetry = vi.fn(async () => false);
    const { rerender } = renderItems(items, { a: "failed" }, onRetry);

    const retry = screen.getByRole("button", { name: "Pokušaj ponovno" });
    await user.click(retry);
    await waitFor(() => expect(onRetry).toHaveBeenCalled());
    act(() => retry.blur());
    rerender(listItems(items, { a: "noPrices" }, onRetry));

    // The handoff would run in this tick; give it the same chance the other tests do.
    await act(async () => {});
    expect(document.body).toHaveFocus();
  });

  it("prefers the retried row that still has no prices", async () => {
    const user = userEvent.setup();
    const items = [item("a"), item("b")];
    const onRetry = vi.fn(async () => false);
    const { rerender } = renderItems(
      items,
      { a: "failed", b: "failed" },
      onRetry,
    );

    await user.click(screen.getByRole("button", { name: "Pokušaj ponovno" }));
    rerender(
      listItems(items, { a: "ready", b: "noPrices" }, onRetry, konzumPrices),
    );

    const [, noPrices] = screen.getAllByRole("combobox");
    await waitFor(() => expect(noPrices).toHaveFocus());
  });
});

describe("ShoppingListItems default store", () => {
  const konzumPrices: IListPrices = {
    cheapestStores: { a: "konzum" },
    storePrices: { a: { konzum: 1.5, lidl: 1.8 } },
  };

  // The list sits in the cache as it does on the page, so a write has an item to send.
  function renderCachedList(items: ShoppingListItemDto[]) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(SHOPPING_LIST_QUERY_KEYS.byId("list-1"), {
      id: "list-1",
      items,
    });

    const writes: unknown[] = [];
    server.use(
      http.put("*/api/shopping-lists/list-1/items/a", async ({ request }) => {
        const body = await request.json();
        writes.push(body);

        return HttpResponse.json({ ...items[0], ...(body as object) });
      }),
      http.get("*/api/shopping-lists/*", () =>
        HttpResponse.json({ id: "list-1", items }),
      ),
    );

    renderWithProviders(
      listItems(items, { a: "ready" }, undefined, konzumPrices),
      { queryClient },
    );

    return writes;
  }

  it("shows the cheapest store without saving it", async () => {
    const writes = renderCachedList([item("a")]);

    expect(screen.getByRole("combobox")).toHaveTextContent("Konzum");
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(writes).toEqual([]);
  });

  it("keeps a store the item already has", () => {
    renderCachedList([item("a", { chainCode: "lidl" })]);

    expect(screen.getByRole("combobox")).toHaveTextContent("Lidl");
  });

  it("saves the shown store when it is picked", async () => {
    // Radix reads pointer capture and scrolls the open list, which jsdom lacks.
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.scrollIntoView = () => {};
    const user = userEvent.setup();
    const writes = renderCachedList([item("a")]);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /Konzum/ }));

    await waitFor(() =>
      expect(writes).toEqual([
        expect.objectContaining({ chainCode: "konzum" }),
      ]),
    );
  });

  it("saves the shown store and its price when the item is ticked", async () => {
    const user = userEvent.setup();
    const writes = renderCachedList([item("a")]);

    await user.click(screen.getByRole("checkbox"));

    await waitFor(() =>
      expect(writes).toEqual([
        expect.objectContaining({
          isChecked: true,
          chainCode: "konzum",
          storePrice: 1.5,
        }),
      ]),
    );
  });
});
