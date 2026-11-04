import { screen, waitFor } from "@testing-library/react";
import { QueryClient, type QueryKey } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it, vi } from "vitest";

import AdminContactTable from "@/app/[locale]/dashboard/components/admin-contact-table";
import AdminUsersTable from "@/app/[locale]/dashboard/components/admin-users-table";
import hr from "@/i18n/messages/hr";
import { ADMIN_QUERY_KEYS } from "@/lib/api/admin/keys";
import { CONTACT_QUERY_KEYS } from "@/lib/api/contact/keys";
import type { UserDto } from "@/lib/api/schemas/auth-user";
import type { ContactMessageDto } from "@/lib/api/types";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";
import { storedUser } from "@/test/stored-user";

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ user: { id: "admin-1" } }),
}));

const ANA = { ...storedUser, id: "ana", username: "ana" } satisfies UserDto;

const MESSAGE: ContactMessageDto = {
  id: "3e7a1c5b-9d2f-4b6a-8c1e-0f4d2a6b8c90",
  userId: null,
  email: null,
  fullName: null,
  subject: "Pitanje",
  message: "Kada se osvježavaju cijene?",
  sourcePath: null,
  readAt: null,
  createdAt: "2026-11-03T09:15:00",
  updatedAt: "2026-11-03T09:15:00",
  deletedAt: null,
};

/** Data the cache already holds, whose background refetch then fails. */
function cachedWithFailingRefetch(
  queryKey: QueryKey,
  data: unknown,
  path: string,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // Stale from the start, so mounting the table refetches.
  queryClient.setQueryData(queryKey, data, { updatedAt: 0 });
  server.use(
    http.get(path, () => HttpResponse.json({ status: 500 }, { status: 500 })),
  );
  return queryClient;
}

async function refetchFailed(queryClient: QueryClient, queryKey: QueryKey) {
  await waitFor(() =>
    expect(queryClient.getQueryState(queryKey)?.status).toBe("error"),
  );
}

describe("admin tables over cached data", () => {
  it("keeps the users when a background refetch fails", async () => {
    const queryClient = cachedWithFailingRefetch(
      ADMIN_QUERY_KEYS.users,
      [ANA],
      "*/api/admin/users",
    );
    renderWithProviders(<AdminUsersTable />, { queryClient });

    await refetchFailed(queryClient, ADMIN_QUERY_KEYS.users);

    expect(screen.queryByText(hr.dashboard.users.loadError)).toBeNull();
    expect(screen.getByText("ana")).toBeInTheDocument();
  });

  it("keeps the contact messages when a background refetch fails", async () => {
    const queryKey = CONTACT_QUERY_KEYS.list(false);
    const queryClient = cachedWithFailingRefetch(
      queryKey,
      [MESSAGE],
      "*/api/admin/contact",
    );
    renderWithProviders(<AdminContactTable />, { queryClient });

    await refetchFailed(queryClient, queryKey);

    expect(screen.queryByText(hr.dashboard.contact.loadError)).toBeNull();
    expect(screen.getByText("Pitanje")).toBeInTheDocument();
  });

  it("still says the users failed when nothing was cached", async () => {
    server.use(
      http.get("*/api/admin/users", () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );
    renderWithProviders(<AdminUsersTable />, {
      queryClient: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    });

    expect(
      await screen.findByText(hr.dashboard.users.loadError),
    ).toBeInTheDocument();
  });
});
