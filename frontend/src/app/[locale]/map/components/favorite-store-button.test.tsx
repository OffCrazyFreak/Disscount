import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

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

    const button = await screen.findByRole("button", {
      name: "Dodaj u omiljene",
    });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);

    await waitFor(() =>
      expect(saved).toEqual({
        stores: [{ storeKey: "lidl:1" }, { storeKey: "konzum:2" }],
      }),
    );
    expect(
      await screen.findByRole("button", { name: "Ukloni iz omiljenih" }),
    ).toHaveAttribute("aria-pressed", "true");
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
    renderWithProviders(<FavoriteStoreButton storeKey="konzum:2" />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Dodaj u omiljene" }),
      ).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "Dodaj u omiljene" }));

    expect(toast.error).toHaveBeenCalledWith("Najviše 10 omiljenih trgovina.");
  });
});
