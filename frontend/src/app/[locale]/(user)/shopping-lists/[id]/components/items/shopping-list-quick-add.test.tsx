import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ShoppingListQuickAdd from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-quick-add";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";

const { openModalUrl } = vi.hoisted(() => ({ openModalUrl: vi.fn() }));
vi.mock("@/lib/modal/modal-navigation", () => ({ openModalUrl }));

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
    openModalUrl.mockClear();
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
    server.use(serveSearch([]), adds.handler);
    renderWithProviders(<ShoppingListQuickAdd listId="list-1" />);

    const input = screen.getByRole("combobox", {
      name: "Dodaj proizvod ili stavku",
    });
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

  it("adds the text on Enter while suggestions show but none is highlighted", async () => {
    const user = userEvent.setup();
    const adds = captureAdds();
    server.use(serveSearch([milk]), adds.handler);
    renderWithProviders(<ShoppingListQuickAdd listId="list-1" />);

    await user.type(screen.getByRole("combobox"), "mlijeko");
    await screen.findByRole("option", { name: /Mlijeko 2,8% 1L/ });
    await user.keyboard("{Enter}");

    await waitFor(() => expect(adds.bodies).toHaveLength(1));
    expect(adds.bodies[0]).toMatchObject({ name: "mlijeko" });
    expect(openModalUrl).not.toHaveBeenCalled();
    expect(await screen.findByText("Dodano: mlijeko")).toBeInTheDocument();
  });

  it("opens the add-to-list modal for a chosen suggestion instead of adding text", async () => {
    const user = userEvent.setup();
    const adds = captureAdds();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    server.use(serveSearch([milk]), adds.handler);
    renderWithProviders(<ShoppingListQuickAdd listId="list-1" />, {
      queryClient,
    });

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
    // Seeded so the modal shows the product at once, offline too.
    expect(
      queryClient.getQueryData(CIJENE_QUERY_KEYS.productByEan(milk.ean)),
    ).toEqual(milk);
  });

  it("says when nothing matches, so Enter adds the text", async () => {
    const user = userEvent.setup();
    server.use(serveSearch([]));
    renderWithProviders(<ShoppingListQuickAdd listId="list-1" />);

    await user.type(screen.getByRole("combobox"), "staklenke");

    expect(
      await screen.findByText(
        "Nema proizvoda s tim nazivom. Pritisni Enter da ga dodaš kao stavku.",
      ),
    ).toBeInTheDocument();
  });

  it("announces a second add of the same name as a new message", async () => {
    const user = userEvent.setup();
    const adds = captureAdds();
    server.use(serveSearch([]), adds.handler);
    renderWithProviders(<ShoppingListQuickAdd listId="list-1" />);

    const input = screen.getByRole("combobox");
    await user.type(input, "kruh{Enter}");
    await waitFor(() => expect(adds.bodies).toHaveLength(1));
    const status = screen.getByRole("status");
    const first = await waitFor(() => {
      expect(status).toHaveTextContent("Dodano: kruh");
      return status.textContent;
    });

    await user.type(input, "kruh{Enter}");
    await waitFor(() => expect(adds.bodies).toHaveLength(2));
    await waitFor(() => expect(status.textContent).not.toBe(first));
  });

  it("moves focus back to the field after a keyboard add with the button", async () => {
    const user = userEvent.setup();
    const adds = captureAdds();
    server.use(serveSearch([]), adds.handler);
    renderWithProviders(<ShoppingListQuickAdd listId="list-1" />);

    const input = screen.getByRole("combobox");
    await user.type(input, "Staklenke");
    await user.tab();
    expect(screen.getByRole("button", { name: "Dodaj" })).toHaveFocus();
    await user.keyboard("{Enter}");

    await waitFor(() => expect(adds.bodies).toHaveLength(1));
    expect(input).toHaveFocus();
  });

  it("hands back a failed add's text even after a second add went out", async () => {
    const user = userEvent.setup();
    let releaseFirst = () => {};
    const firstHeld = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    server.use(
      serveSearch([]),
      http.post("*/api/shopping-lists/:listId/items", async ({ request }) => {
        const body = (await request.json()) as { name: string };
        if (body.name === "kruh") {
          await firstHeld;
          return HttpResponse.json({ status: 500 }, { status: 500 });
        }
        return HttpResponse.json({
          id: "item",
          shoppingListId: "list-1",
          createdAt: "2026-11-02T10:00:00",
          ...body,
        });
      }),
    );
    renderWithProviders(<ShoppingListQuickAdd listId="list-1" />);

    const input = screen.getByRole("combobox");
    await user.type(input, "kruh{Enter}");
    await user.type(input, "mlijeko{Enter}");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Dodano: mlijeko"),
    );
    releaseFirst();

    await waitFor(() => expect(input).toHaveValue("kruh"));
  });

  it("keeps the add button off until there is text", async () => {
    const user = userEvent.setup();
    server.use(serveSearch([]));
    renderWithProviders(<ShoppingListQuickAdd listId="list-1" />);

    const button = screen.getByRole("button", { name: "Dodaj" });
    expect(button).toBeDisabled();

    await user.type(screen.getByRole("combobox"), "a");
    expect(button).toBeEnabled();
  });
});
