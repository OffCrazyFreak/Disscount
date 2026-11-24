import * as Sentry from "@sentry/nextjs";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import RouteError from "@/app/[locale]/error";
import { renderWithProviders } from "@/test/render";

const { reload } = vi.hoisted(() => ({ reload: vi.fn() }));

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
// jsdom cannot reload, so the real recovery runs with a recorded reload instead.
vi.mock("@/lib/pwa/chunk-load-recovery", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/pwa/chunk-load-recovery")>();
  return {
    ...actual,
    reloadAfterChunkLoadError: (error: unknown) =>
      actual.reloadAfterChunkLoadError(error, reload),
  };
});

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

function serverError() {
  return Object.assign(new Error("Server Components render failed"), {
    digest: "4242",
  });
}

describe("RouteError", () => {
  it("shows the Croatian copy and moves focus to the heading", () => {
    renderWithProviders(<RouteError error={serverError()} retry={vi.fn()} />);

    const heading = screen.getByRole("heading", {
      name: "Ups, ova stranica se spotaknula",
    });
    expect(heading).toHaveFocus();
    expect(screen.getByRole("link", { name: "Na početnu" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.queryByText(/4242/)).not.toBeInTheDocument();
  });

  it("uses the active locale", () => {
    renderWithProviders(<RouteError error={serverError()} retry={vi.fn()} />, {
      locale: "de",
    });

    expect(
      screen.getByRole("heading", {
        name: "Hoppla, diese Seite ist gestolpert",
      }),
    ).toBeInTheDocument();
  });

  it("retries the segment", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    renderWithProviders(<RouteError error={serverError()} retry={retry} />);

    await user.click(screen.getByRole("button", { name: "Pokušaj ponovno" }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it("reports the error to Sentry with the digest as a tag", () => {
    const error = serverError();
    renderWithProviders(<RouteError error={error} retry={vi.fn()} />);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { digest: "4242" },
    });
  });

  it("reports a thrown non-Error value without tags", () => {
    renderWithProviders(<RouteError error="boom" retry={vi.fn()} />);

    expect(Sentry.captureException).toHaveBeenCalledWith("boom", undefined);
  });

  it("reloads once instead of reporting a chunk left behind by a deploy", () => {
    vi.mocked(Sentry.captureException).mockClear();
    const error = Object.assign(new Error("Loading chunk 6506 failed."), {
      name: "ChunkLoadError",
    });

    renderWithProviders(<RouteError error={error} retry={vi.fn()} />);

    expect(reload).toHaveBeenCalledOnce();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
