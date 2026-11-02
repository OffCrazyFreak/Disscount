import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AddPlainItemModal from "@/app/[locale]/products/components/forms/add-plain-item-modal";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

const { openModalUrl, closeModalUrl } = vi.hoisted(() => ({
  openModalUrl: vi.fn(),
  closeModalUrl: vi.fn(),
}));
vi.mock("@/lib/modal/modal-navigation", () => ({
  openModalUrl,
  closeModalUrl,
}));
vi.mock("@/context/user-context", () => ({ useUser: () => ({ user: {} }) }));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function list(id: string, title: string, updatedAt: string) {
  return {
    id,
    title,
    myAccess: "OWNER",
    updatedAt,
    createdAt: updatedAt,
    items: [],
  };
}

const newest = list("list-a", "Tjedna kupnja", "2026-11-02T10:00:00");
const older = list("list-b", "Vikendica", "2026-10-01T10:00:00");

describe("AddPlainItemModal", () => {
  beforeEach(() => {
    openModalUrl.mockClear();
    closeModalUrl.mockClear();
    localStorage.clear();
    // jsdom has no scrollIntoView; cmdk calls it on the highlighted list option.
    Element.prototype.scrollIntoView ??= vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("reopens a failed add with the list and amount the user chose", async () => {
    const user = userEvent.setup();
    const added: unknown[] = [];
    server.use(
      http.get("*/api/auth/token", () =>
        HttpResponse.json(null, { status: 401 }),
      ),
      http.get("*/api/shopping-lists/me", () =>
        HttpResponse.json([newest, older]),
      ),
      http.get("*/api/shopping-lists/:id", ({ params }) =>
        HttpResponse.json(params.id === older.id ? older : newest),
      ),
      http.post("*/api/shopping-lists/:id/items", async ({ request }) => {
        added.push(await request.json());
        return HttpResponse.json(
          { status: 500, detail: "Nešto je pošlo po zlu." },
          { status: 500 },
        );
      }),
    );

    const first = renderWithProviders(
      <AddPlainItemModal open itemName="Staklenke" />,
    );
    const trigger = await screen.findByRole("combobox", {
      name: "Popis za kupnju",
    });
    await waitFor(() => expect(trigger).toHaveTextContent("Tjedna kupnja"));
    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: /Vikendica/ }));
    await user.click(screen.getByRole("button", { name: "Povećaj za 1" }));
    await user.click(screen.getByRole("button", { name: "Dodaj" }));

    await waitFor(() =>
      expect(openModalUrl).toHaveBeenCalledWith({
        name: "add-plain-item",
        itemName: "Staklenke",
      }),
    );
    expect(closeModalUrl).toHaveBeenCalled();
    expect(added).toEqual([{ name: "Staklenke", amount: 2, isChecked: false }]);
    first.unmount();

    renderWithProviders(<AddPlainItemModal open itemName="Staklenke" />);

    const reopened = await screen.findByRole("combobox", {
      name: "Popis za kupnju",
    });
    await waitFor(() => expect(reopened).toHaveTextContent("Vikendica"));
    expect(screen.getByRole("spinbutton", { name: "Količina" })).toHaveValue(2);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
  it("keeps a cancelled choice to its own item name", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/auth/token", () =>
        HttpResponse.json(null, { status: 401 }),
      ),
      http.get("*/api/shopping-lists/me", () =>
        HttpResponse.json([newest, older]),
      ),
      http.get("*/api/shopping-lists/:id", ({ params }) =>
        HttpResponse.json(params.id === older.id ? older : newest),
      ),
    );

    const first = renderWithProviders(
      <AddPlainItemModal open itemName="Staklenke" />,
    );
    const trigger = await screen.findByRole("combobox", {
      name: "Popis za kupnju",
    });
    await waitFor(() => expect(trigger).toHaveTextContent("Tjedna kupnja"));
    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: /Vikendica/ }));
    await user.click(screen.getByRole("button", { name: "Povećaj za 1" }));
    first.unmount();

    renderWithProviders(<AddPlainItemModal open itemName="Mlijeko" />);

    const other = await screen.findByRole("combobox", {
      name: "Popis za kupnju",
    });
    await waitFor(() => expect(other).toHaveTextContent("Tjedna kupnja"));
    expect(screen.getByRole("spinbutton", { name: "Količina" })).toHaveValue(1);
  });

  it("retries a failed add into the list it already created", async () => {
    const user = userEvent.setup();
    const created = list("list-c", "Za vikend", "2026-11-03T10:00:00");
    const createdLists: unknown[] = [];
    const addedTo: string[] = [];
    server.use(
      http.get("*/api/auth/token", () =>
        HttpResponse.json(null, { status: 401 }),
      ),
      http.get("*/api/shopping-lists/me", () =>
        HttpResponse.json(
          createdLists.length > 0 ? [created, newest, older] : [newest, older],
        ),
      ),
      http.get("*/api/shopping-lists/:id", ({ params }) =>
        HttpResponse.json(
          [created, newest, older].find((entry) => entry.id === params.id),
        ),
      ),
      http.post("*/api/shopping-lists", async ({ request }) => {
        createdLists.push(await request.json());
        return HttpResponse.json(created);
      }),
      http.post("*/api/shopping-lists/:id/items", ({ params }) => {
        addedTo.push(String(params.id));
        return HttpResponse.json({ status: 500 }, { status: 500 });
      }),
    );

    const first = renderWithProviders(
      <AddPlainItemModal open itemName="Staklenke" />,
    );
    const trigger = await screen.findByRole("combobox", {
      name: "Popis za kupnju",
    });
    await waitFor(() => expect(trigger).toHaveTextContent("Tjedna kupnja"));
    await user.click(trigger);
    await user.type(
      await screen.findByPlaceholderText(/Pretraži svoje popise/),
      "Za vikend",
    );
    await user.click(await screen.findByRole("option", { name: /Za vikend/ }));
    await user.click(screen.getByRole("button", { name: "Dodaj" }));
    await waitFor(() => expect(openModalUrl).toHaveBeenCalled());
    first.unmount();

    renderWithProviders(<AddPlainItemModal open itemName="Staklenke" />);
    const reopened = await screen.findByRole("combobox", {
      name: "Popis za kupnju",
    });
    await waitFor(() => expect(reopened).toHaveTextContent("Za vikend"));
    await user.click(screen.getByRole("button", { name: "Dodaj" }));

    await waitFor(() => expect(addedTo).toEqual(["list-c", "list-c"]));
    expect(createdLists).toHaveLength(1);
  });
});
