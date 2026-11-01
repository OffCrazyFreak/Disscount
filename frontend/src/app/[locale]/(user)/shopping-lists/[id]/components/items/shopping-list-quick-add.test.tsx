import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ShoppingListQuickAdd from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-quick-add";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

const { openModalUrl } = vi.hoisted(() => ({ openModalUrl: vi.fn() }));
vi.mock("@/lib/modal/modal-navigation", () => ({ openModalUrl }));

const signedOut = http.get("*/api/auth/token", () =>
  HttpResponse.json(null, { status: 401 }),
);

const milk = {
  ean: "3850000000001",
  brand: "Dukat",
  name: "Mlijeko 2,8% 1L",
  quantity: "1",
  unit: "L",
  chains: [],
};

function serveSearch(products: unknown[]) {
  return http.get("*/api/cijene/products", () =>
    HttpResponse.json({ products }),
  );
}

function captureAdds() {
  const bodies: unknown[] = [];
  const handler = http.post(
    "*/api/shopping-lists/:listId/items",
    async ({ request }) => {
      const body = await request.json();
      bodies.push(body);
      return HttpResponse.json({
        id: "item",
        shoppingListId: "list-1",
        createdAt: "2026-11-02T10:00:00",
        ...(body as object),
      });
    },
  );
  return { bodies, handler };
}

describe("ShoppingListQuickAdd", () => {
  beforeEach(() => {
    // jsdom has no ResizeObserver; the suggestion list's scroll fade only reads sizes.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("adds the typed text as a plain item on Enter and stays ready for the next one", async () => {
    const user = userEvent.setup();
    const adds = captureAdds();
    server.use(signedOut, serveSearch([]), adds.handler);
    renderWithProviders(<ShoppingListQuickAdd listId="list-1" />);

    const input = screen.getByRole("combobox", { name: "Dodaj stavku" });
    await user.type(input, "  Staklenke {Enter}");

    await waitFor(() => expect(adds.bodies).toHaveLength(1));
    expect(adds.bodies[0]).toEqual({
      name: "Staklenke",
      amount: 1,
      isChecked: false,
    });
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(openModalUrl).not.toHaveBeenCalled();
  });

  it("opens the add-to-list modal for a chosen suggestion instead of adding text", async () => {
    const user = userEvent.setup();
    const adds = captureAdds();
    server.use(signedOut, serveSearch([milk]), adds.handler);
    renderWithProviders(<ShoppingListQuickAdd listId="list-1" />);

    await user.type(screen.getByRole("combobox"), "mlijeko");
    await screen.findByRole("option", { name: /Mlijeko 2,8% 1L/ });
    await user.keyboard("{ArrowDown}{Enter}");

    await waitFor(() =>
      expect(openModalUrl).toHaveBeenCalledWith({
        name: "add-to-list",
        ean: milk.ean,
        listId: "list-1",
      }),
    );
    expect(adds.bodies).toHaveLength(0);
  });

  it("says when nothing matches, so Enter adds the text", async () => {
    const user = userEvent.setup();
    server.use(signedOut, serveSearch([]));
    renderWithProviders(<ShoppingListQuickAdd listId="list-1" />);

    await user.type(screen.getByRole("combobox"), "staklenke");

    expect(
      await screen.findByText(
        "Nema proizvoda s tim nazivom. Pritisni Enter da ga dodaš kao stavku.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the add button off until there is text", async () => {
    const user = userEvent.setup();
    server.use(signedOut, serveSearch([]));
    renderWithProviders(<ShoppingListQuickAdd listId="list-1" />);

    const button = screen.getByRole("button", { name: "Dodaj" });
    expect(button).toBeDisabled();

    await user.type(screen.getByRole("combobox"), "a");
    expect(button).toBeEnabled();
  });
});
