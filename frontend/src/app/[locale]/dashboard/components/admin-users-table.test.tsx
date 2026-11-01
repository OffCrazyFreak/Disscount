import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminUsersTable from "@/app/[locale]/dashboard/components/admin-users-table";
import type { UserDto } from "@/lib/api/schemas/auth-user";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

// The session is a boundary the suite cannot run: signed in as another admin.
vi.mock("@/context/user-context", () => ({
  useUser: () => ({ user: { id: "admin-1" } }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const signedOut = http.get("*/api/auth/token", () =>
  HttpResponse.json(null, { status: 401 }),
);

const USER = {
  id: "user-1",
  username: "ana",
  email: "ana@example.com",
  accountType: "CONSUMER",
} satisfies Partial<UserDto>;

function serveUsers(getAccountType: () => string) {
  return http.get("*/api/admin/users", () =>
    HttpResponse.json([{ ...USER, accountType: getAccountType() }]),
  );
}

async function chooseAdmin() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("combobox"));
  await user.click(await screen.findByRole("option", { name: "Admin" }));
}

describe("AdminUsersTable account type", () => {
  // jsdom lacks the observer, pointer capture and scrolling APIs the table and Radix Select call.
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.releasePointerCapture = () => {};
    Element.prototype.scrollIntoView = () => {};
  });

  beforeEach(() => {
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
  });

  it("shows the chosen type while saving and keeps it once the server agrees", async () => {
    let stored = "CONSUMER";
    let release = () => {};
    const saving = new Promise<void>((resolve) => (release = resolve));
    server.use(
      signedOut,
      serveUsers(() => stored),
      http.patch("*/api/admin/users/:id", async ({ request }) => {
        await saving;
        stored = ((await request.json()) as { accountType: string })
          .accountType;
        return HttpResponse.json({ ...USER, accountType: stored });
      }),
    );

    renderWithProviders(<AdminUsersTable />);
    await chooseAdmin();

    expect(screen.getByRole("combobox")).toHaveTextContent("Admin");

    release();
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByRole("combobox")).not.toBeDisabled(),
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Admin");
  });

  it("rolls back to the saved type with an error toast when the save fails", async () => {
    server.use(
      signedOut,
      serveUsers(() => "CONSUMER"),
      http.patch("*/api/admin/users/:id", async () => {
        await delay(50);
        return HttpResponse.json(null, { status: 500 });
      }),
    );

    renderWithProviders(<AdminUsersTable />);
    await chooseAdmin();

    expect(screen.getByRole("combobox")).toHaveTextContent("Admin");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Greška pri promjeni vrste računa.",
      ),
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Korisnik");
  });
});
