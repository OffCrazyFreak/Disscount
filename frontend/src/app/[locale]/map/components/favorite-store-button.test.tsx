import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FavoriteStoreButton from "@/app/[locale]/map/components/favorite-store-button";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

// The session is a boundary the suite cannot run: signed in for these tests.
vi.mock("@/context/user-context", () => ({
  useUser: () => ({ isAuthenticated: true }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const signedOut = http.get("*/api/auth/token", () =>
  HttpResponse.json(null, { status: 401 }),
);

function favorites(keys: string[]) {
  return keys.map((storeKey) => ({ id: storeKey, storeKey }));
}

describe("FavoriteStoreButton", () => {
  beforeEach(() => vi.mocked(toast.error).mockClear());

  it("adds the store to the saved list and shows it as pressed", async () => {
    let stored = ["lidl:1"];
    let saved: unknown;
    server.use(
      signedOut,
      http.get("*/api/favorite-stores/me", () =>
        HttpResponse.json(favorites(stored)),
      ),
      http.put("*/api/favorite-stores/bulk", async ({ request }) => {
        saved = await request.json();
        stored = (saved as { stores: { storeKey: string }[] }).stores.map(
          (store) => store.storeKey,
        );
        return HttpResponse.json(favorites(stored));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<FavoriteStoreButton storeKey="konzum:2" />);

    await user.click(
      await screen.findByRole("button", { name: "Dodaj u omiljene" }),
    );

    await waitFor(() =>
      expect(saved).toEqual({
        stores: [{ storeKey: "lidl:1" }, { storeKey: "konzum:2" }],
      }),
    );
    expect(
      await screen.findByRole("button", { name: "Ukloni iz omiljenih" }),
    ).toBeInTheDocument();
  });

  it("refuses an eleventh favourite without asking the server", async () => {
    const ten = Array.from({ length: 10 }, (_, i) => `spar:${i}`);
    server.use(
      signedOut,
      http.get("*/api/favorite-stores/me", () =>
        HttpResponse.json(favorites(ten)),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <FavoriteStoreButton storeKey="spar:0" />
        <FavoriteStoreButton storeKey="konzum:2" />
      </>,
    );

    await screen.findByRole("button", { name: "Ukloni iz omiljenih" });
    await user.click(screen.getByRole("button", { name: "Dodaj u omiljene" }));

    expect(toast.error).toHaveBeenCalledWith("Najviše 10 omiljenih trgovina.");
  });

  it("does not save before the saved list has loaded", async () => {
    const put = vi.fn();
    server.use(
      signedOut,
      http.get("*/api/favorite-stores/me", () => new Promise<never>(() => {})),
      http.put("*/api/favorite-stores/bulk", () => {
        put();
        return HttpResponse.json([]);
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<FavoriteStoreButton storeKey="konzum:2" />);

    await user.click(screen.getByRole("button", { name: "Dodaj u omiljene" }));

    expect(toast.error).toHaveBeenCalledWith(
      "Spremanje nije uspjelo. Pokušaj ponovno.",
    );
    expect(put).not.toHaveBeenCalled();
  });

  it("puts the star back when the save fails", async () => {
    server.use(
      signedOut,
      http.get("*/api/favorite-stores/me", () =>
        HttpResponse.json(favorites(["spar:0"])),
      ),
      http.put("*/api/favorite-stores/bulk", () =>
        HttpResponse.json(null, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<FavoriteStoreButton storeKey="spar:0" />);

    await user.click(
      await screen.findByRole("button", { name: "Ukloni iz omiljenih" }),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Spremanje nije uspjelo. Pokušaj ponovno.",
      ),
    );
    expect(
      screen.getByRole("button", { name: "Ukloni iz omiljenih" }),
    ).toBeInTheDocument();
  });
});
