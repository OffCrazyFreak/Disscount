import { QueryClient } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AddToShoppingListForm from "@/app/[locale]/products/components/forms/add-to-shopping-list-form";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";
import { setFormDraft } from "@/utils/browser/local-storage";

vi.mock("@/lib/modal/modal-navigation", () => ({
  openModalUrl: vi.fn(),
  closeModalUrl: vi.fn(),
}));
vi.mock("@/context/user-context", () => ({
  useUser: () => ({ user: {}, accountUser: null }),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/products",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const SUGAR: ProductResponse = {
  ean: "3850104004421",
  brand: "Viro",
  name: "Šećer 1 kg",
  quantity: "1",
  unit: "kg",
  chains: [],
};

const WEEKLY = {
  id: "list-a",
  title: "Tjedna kupnja",
  ownerId: "user-1",
  linkAccess: null,
  myAccess: "OWNER",
  updatedAt: "2026-11-02T10:00:00",
  createdAt: "2026-11-02T10:00:00",
  items: [],
};

const TOO_SHORT = "Upiši naziv s najmanje 3 znaka";
const TOO_LONG = "Upiši naziv s najviše 100 znakova";

describe("AddToShoppingListForm", () => {
  beforeEach(() => {
    localStorage.clear();
    // jsdom has no scrollIntoView; cmdk calls it on the highlighted list option.
    Element.prototype.scrollIntoView ??= vi.fn();
    server.use(
      http.get("*/api/shopping-lists/me", () => HttpResponse.json([WEEKLY])),
      http.get("*/api/shopping-lists/:id", () => HttpResponse.json(WEEKLY)),
      http.get("*/api/products/images/thumbnails", () =>
        HttpResponse.json({ thumbnails: {} }),
      ),
    );
  });

  async function chooseNewList(title: string) {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(CIJENE_QUERY_KEYS.productByEan(SUGAR.ean), SUGAR);

    renderWithProviders(<AddToShoppingListForm open ean={SUGAR.ean} />, {
      queryClient,
    });
    const trigger = await screen.findByRole("combobox", {
      name: "Popis za kupnju",
    });
    await waitFor(() => expect(trigger).toHaveTextContent("Tjedna kupnja"));
    await user.click(trigger);
    // Pasted, since typing 101 characters one key at a time is slow.
    await user.click(
      await screen.findByPlaceholderText(/Pretraži svoje popise/),
    );
    await user.paste(title);
    await user.click(await screen.findByRole("option", { name: /Stvori/ }));

    return { user, trigger };
  }

  it("explains why a too short new list title blocks the add", async () => {
    await chooseNewList("ab");

    expect(await screen.findByRole("alert")).toHaveTextContent(TOO_SHORT);
    expect(screen.getByRole("button", { name: "Dodaj" })).toBeDisabled();
  });

  it("explains why a too long new list title blocks the add", async () => {
    await chooseNewList("a".repeat(101));

    expect(await screen.findByText(TOO_LONG)).toBeVisible();
    expect(screen.getByRole("button", { name: "Dodaj" })).toBeDisabled();
  });

  it("drops the title message once an existing list is picked", async () => {
    const { user, trigger } = await chooseNewList("ab");
    await screen.findByText(TOO_SHORT);

    await user.click(trigger);
    // Reopening prefills the search with the new title, which hides the lists.
    await user.clear(
      await screen.findByPlaceholderText(/Pretraži svoje popise/),
    );
    await user.click(
      await screen.findByRole("option", { name: /Tjedna kupnja/ }),
    );

    await waitFor(() =>
      expect(screen.queryByText(TOO_SHORT)).not.toBeInTheDocument(),
    );
  });

  it("explains a too short title restored from a draft", async () => {
    setFormDraft(`add-to-list.${SUGAR.ean}`, {
      shoppingListId: "new",
      customListTitle: "ab",
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(CIJENE_QUERY_KEYS.productByEan(SUGAR.ean), SUGAR);

    renderWithProviders(<AddToShoppingListForm open ean={SUGAR.ean} />, {
      queryClient,
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(TOO_SHORT);
    expect(screen.getByRole("button", { name: "Dodaj" })).toBeDisabled();
  });
});
