import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it, onTestFinished, vi } from "vitest";

import AdminContactTable from "@/app/[locale]/dashboard/components/admin-contact-table";
import hr from "@/i18n/messages/hr";
import type { ContactMessageDto } from "@/lib/api/types";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ user: { id: "admin-1" } }),
}));

const TOTAL_PAGES = 2;

function message(subject: string): ContactMessageDto {
  return {
    id: `id-${subject}`,
    userId: null,
    email: null,
    fullName: null,
    subject,
    message: "Poruka",
    sourcePath: null,
    readAt: null,
    createdAt: "2026-11-03T09:15:00",
    updatedAt: "2026-11-03T09:15:00",
    deletedAt: null,
  };
}

/** Answers page 0 with "Prva" and page 1 with "Druga", and records which pages were asked for. */
function serveTwoPages(): number[] {
  const requested: number[] = [];

  server.use(
    http.get("*/api/admin/contact", ({ request }) => {
      const number = Number(new URL(request.url).searchParams.get("page"));
      requested.push(number);

      return HttpResponse.json({
        items: [message(number === 0 ? "Prva" : "Druga")],
        page: {
          number,
          size: 1,
          totalItems: TOTAL_PAGES,
          totalPages: TOTAL_PAGES,
        },
      });
    }),
  );

  return requested;
}

// jsdom lays nothing out, so the page height is set by hand to put the end near or far.
function setPageHeight(height: number) {
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: height,
  });
  onTestFinished(() => {
    Reflect.deleteProperty(document.documentElement, "scrollHeight");
  });
}

function renderTable() {
  renderWithProviders(<AdminContactTable />, {
    queryClient: new QueryClient({
      defaultOptions: { queries: { retry: false } },
    }),
  });
}

describe("AdminContactTable paging", () => {
  it("loads the next page when a scroll nears the page end", async () => {
    const requested = serveTwoPages();
    setPageHeight(100_000);
    renderTable();

    expect(await screen.findByText("Prva")).toBeInTheDocument();
    expect(requested).toStrictEqual([0]);

    setPageHeight(0);
    window.dispatchEvent(new Event("scroll"));

    expect(await screen.findByText("Druga")).toBeInTheDocument();
    expect(requested).toStrictEqual([0, 1]);
  });

  it("loads the next page on its own when the first is too short to scroll", async () => {
    const requested = serveTwoPages();
    renderTable();

    expect(await screen.findByText("Druga")).toBeInTheDocument();
    expect(screen.getByText("Prva")).toBeInTheDocument();
    await waitFor(() => expect(requested).toStrictEqual([0, 1]));
  });

  it("offers a retry when the next page fails", async () => {
    const requested = serveTwoPages();
    let failNextPage = true;
    server.use(
      http.get("*/api/admin/contact", ({ request }) => {
        const page = new URL(request.url).searchParams.get("page");
        if (page !== "1" || !failNextPage) return undefined;

        failNextPage = false;
        return HttpResponse.json({ status: 500 }, { status: 500 });
      }),
    );
    renderTable();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      hr.dashboard.contact.loadMoreError,
    );

    await userEvent.click(
      screen.getByRole("button", { name: hr.dashboard.contact.loadMoreRetry }),
    );

    expect(await screen.findByText("Druga")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(requested).toStrictEqual([0, 1]);
  });
});
