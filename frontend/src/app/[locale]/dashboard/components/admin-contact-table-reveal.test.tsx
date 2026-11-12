import { fireEvent, screen } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it, vi } from "vitest";

import AdminContactTable from "@/app/[locale]/dashboard/components/admin-contact-table";
import hr from "@/i18n/messages/hr";
import type { ContactMessageDto } from "@/lib/api/types";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ user: { id: "admin-1" } }),
}));

// One batch and a bit, so the last messages wait for a scroll.
const MESSAGE_COUNT = 60;

function message(number: number): ContactMessageDto {
  return {
    id: `id-${number}`,
    userId: null,
    email: null,
    fullName: null,
    subject: `Pitanje ${number}`,
    message: "Poruka",
    sourcePath: null,
    readAt: null,
    createdAt: "2026-11-03T09:15:00",
    updatedAt: "2026-11-03T09:15:00",
    deletedAt: null,
  };
}

function renderInbox() {
  server.use(
    http.get("*/api/admin/contact", () =>
      HttpResponse.json(
        Array.from({ length: MESSAGE_COUNT }, (_, i) => message(i + 1)),
      ),
    ),
  );
  renderWithProviders(<AdminContactTable />, {
    queryClient: new QueryClient({
      defaultOptions: { queries: { retry: false } },
    }),
  });
}

describe("AdminContactTable reveal", () => {
  it("shows 50 messages, then the rest once a scroll nears the page end", async () => {
    renderInbox();

    expect(await screen.findByText("Pitanje 50")).toBeInTheDocument();
    expect(screen.queryByText("Pitanje 51")).toBeNull();

    fireEvent.scroll(window);

    expect(await screen.findByText("Pitanje 60")).toBeInTheDocument();
  });

  it("searches every loaded message, not only the ones shown", async () => {
    renderInbox();
    await screen.findByText("Pitanje 50");

    fireEvent.change(
      screen.getByPlaceholderText(hr.dashboard.contact.searchPlaceholder),
      { target: { value: "Pitanje 60" } },
    );

    expect(await screen.findByText("Pitanje 60")).toBeInTheDocument();
    expect(screen.queryByText("Pitanje 50")).toBeNull();
  });
});
