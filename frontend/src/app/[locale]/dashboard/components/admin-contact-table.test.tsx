import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminContactTable from "@/app/[locale]/dashboard/components/admin-contact-table";
import hr from "@/i18n/messages/hr";
import type { ContactMessageDto } from "@/lib/api/types";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ user: { id: "admin-1" } }),
}));

const DELETED: ContactMessageDto = {
  id: "5b1d2e3f-4a6c-4d8e-9f0a-1b2c3d4e5f60",
  userId: null,
  email: null,
  fullName: null,
  subject: "Stara poruka",
  message: "Obrisana poruka",
  sourcePath: null,
  readAt: null,
  createdAt: "2026-11-02T09:15:00",
  updatedAt: "2026-11-02T09:15:00",
  deletedAt: "2026-11-02T10:00:00",
};

describe("AdminContactTable", () => {
  beforeEach(() => {
    // jsdom has no ResizeObserver; the table and Radix Select call it.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("keeps the filters usable when a view fails to load", async () => {
    server.use(
      http.get("*/api/admin/contact", ({ request }) =>
        new URL(request.url).searchParams.get("includeDeleted") === "true"
          ? HttpResponse.json([DELETED])
          : HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );
    renderWithProviders(<AdminContactTable />, {
      queryClient: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      hr.dashboard.contact.loadError,
    );

    await userEvent.click(screen.getByRole("switch"));

    expect(await screen.findByText("Stara poruka")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
