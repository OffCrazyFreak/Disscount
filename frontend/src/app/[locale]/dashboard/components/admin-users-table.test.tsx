import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminUsersTable from "@/app/[locale]/dashboard/components/admin-users-table";
import type { AccountType, UserDto } from "@/lib/api/schemas/auth-user";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";
import { storedUser } from "@/test/stored-user";

// The session is a boundary the suite cannot run: signed in as another admin.
vi.mock("@/context/user-context", () => ({
  useUser: () => ({ user: { id: "admin-1" } }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const ANA = { ...storedUser, id: "ana", username: "ana" } satisfies UserDto;
const IVO = { ...storedUser, id: "ivo", username: "ivo" } satisfies UserDto;

function held() {
  let release = () => {};
  const promise = new Promise<void>((resolve) => (release = resolve));
  return { promise, release };
}

function serveUsers(users: () => UserDto[]) {
  return http.get("*/api/admin/users", () => HttpResponse.json(users()));
}

function servePhotoCounts(
  counts: { userId: string; uploaded: number; deleted: number }[] = [],
) {
  return http.get("*/api/admin/product-images/contributors", () =>
    HttpResponse.json(counts),
  );
}

function accountTypeOf(username: string) {
  const row = screen.getByText(username).closest("tr")!;
  return within(row).getByRole("combobox");
}

async function chooseAdmin(username: string) {
  const user = userEvent.setup();
  await screen.findByText(username);
  await user.click(accountTypeOf(username));
  await user.click(await screen.findByRole("option", { name: "Admin" }));
}

describe("AdminUsersTable account type", () => {
  // jsdom lacks the pointer capture and scrolling APIs the table and Radix Select call.
  beforeEach(() => {
    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.releasePointerCapture ??= () => {};
    Element.prototype.scrollIntoView ??= () => {};
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
    server.use(servePhotoCounts());
  });

  it("shows the chosen type while saving and keeps it once the server agrees", async () => {
    let stored: AccountType = "CONSUMER";
    const saving = held();
    server.use(
      serveUsers(() => [{ ...ANA, accountType: stored }]),
      http.patch("*/api/admin/users/:id", async ({ request }) => {
        await saving.promise;
        stored = ((await request.json()) as { accountType: AccountType })
          .accountType;
        return HttpResponse.json({ ...ANA, accountType: stored });
      }),
    );

    renderWithProviders(<AdminUsersTable />);
    await chooseAdmin("ana");

    expect(accountTypeOf("ana")).toHaveTextContent("Admin");

    saving.release();
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(accountTypeOf("ana")).toHaveTextContent("Admin");
  });

  it("rolls back to the saved type with an error toast when the save fails", async () => {
    const saving = held();
    server.use(
      serveUsers(() => [ANA]),
      http.patch("*/api/admin/users/:id", async () => {
        await saving.promise;
        return HttpResponse.json(null, { status: 500 });
      }),
    );

    renderWithProviders(<AdminUsersTable />);
    await chooseAdmin("ana");

    expect(accountTypeOf("ana")).toHaveTextContent("Admin");

    saving.release();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Greška pri promjeni vrste računa.",
      ),
    );
    expect(accountTypeOf("ana")).toHaveTextContent("Korisnik");
  });

  it("keeps a second row's pending type when the first row's save fails", async () => {
    const savingAna = held();
    const savingIvo = held();
    let ivoType: AccountType = "CONSUMER";
    let reads = 0;
    server.use(
      serveUsers(() => {
        reads += 1;
        return [ANA, { ...IVO, accountType: ivoType }];
      }),
      http.patch("*/api/admin/users/ana", async () => {
        await savingAna.promise;
        return HttpResponse.json(null, { status: 500 });
      }),
      http.patch("*/api/admin/users/ivo", async () => {
        await savingIvo.promise;
        ivoType = "ADMIN";
        return HttpResponse.json({ ...IVO, accountType: ivoType });
      }),
    );

    renderWithProviders(<AdminUsersTable />);
    await chooseAdmin("ana");
    await chooseAdmin("ivo");

    savingAna.release();
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(accountTypeOf("ana")).toHaveTextContent("Korisnik");
    expect(accountTypeOf("ivo")).toHaveTextContent("Admin");
    expect(reads).toBe(1);

    savingIvo.release();
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    // One refetch once the last save settles brings both rows back in line with the server.
    expect(reads).toBe(2);
    expect(accountTypeOf("ana")).toHaveTextContent("Korisnik");
    expect(accountTypeOf("ivo")).toHaveTextContent("Admin");
  });
});

describe("AdminUsersTable photo counts", () => {
  it("shows each user's uploaded and deleted photos, and zero for users without any", async () => {
    server.use(
      serveUsers(() => [ANA, IVO]),
      servePhotoCounts([{ userId: "ana", uploaded: 5, deleted: 2 }]),
    );

    renderWithProviders(<AdminUsersTable />);

    const anaRow = (await screen.findByText("ana")).closest("tr")!;
    await waitFor(() =>
      expect(within(anaRow).getByText("5 · 2 obrisane")).toBeInTheDocument(),
    );
    const ivoRow = screen.getByText("ivo").closest("tr")!;
    expect(within(ivoRow).getByText("0 · 0 obrisanih")).toBeInTheDocument();
  });

  it("shows a dash instead of zero when the counts fail to load", async () => {
    server.use(
      serveUsers(() => [ANA]),
      http.get("*/api/admin/product-images/contributors", () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    renderWithProviders(<AdminUsersTable />);

    const anaRow = (await screen.findByText("ana")).closest("tr")!;
    expect(within(anaRow).queryByText(/obrisan/)).toBeNull();
    expect(within(anaRow).getAllByText("-").length).toBeGreaterThan(0);
  });
});

describe("AdminUsersTable reveal", () => {
  it("shows 50 users, then the rest once a scroll nears the page end", async () => {
    const users = Array.from({ length: 60 }, (_, i) => ({
      ...storedUser,
      id: `user-${i + 1}`,
      username: `korisnik${i + 1}`,
    }));
    server.use(
      servePhotoCounts(),
      serveUsers(() => users),
    );
    renderWithProviders(<AdminUsersTable />);

    expect(await screen.findByText("korisnik50")).toBeInTheDocument();
    expect(screen.queryByText("korisnik51")).toBeNull();

    fireEvent.scroll(window);

    expect(await screen.findByText("korisnik60")).toBeInTheDocument();
  });
});
