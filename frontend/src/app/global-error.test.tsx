import * as Sentry from "@sentry/nextjs";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import GlobalError from "@/app/global-error";

const { pathname, reload } = vi.hoisted(() => ({
  pathname: { current: "/" },
  reload: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));
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

function renderAt(path: string, retry = vi.fn()) {
  pathname.current = path;
  const error = Object.assign(new Error("Root layout failed"), {
    digest: "9001",
  });
  render(<GlobalError error={error} retry={retry} />, {
    container: document,
  });
  return { error, retry };
}

describe("GlobalError", () => {
  it("falls back to Croatian on a bare path and focuses the heading", () => {
    renderAt("/products");

    expect(document.documentElement).toHaveAttribute("lang", "hr");
    expect(
      screen.getByRole("heading", { name: "Ups, ova stranica se spotaknula" }),
    ).toHaveFocus();
    expect(screen.getByRole("link", { name: "Na početnu" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.queryByText(/9001/)).not.toBeInTheDocument();
  });

  it.each([
    ["/en/products", "en", "Oops, this page tripped up", "Back to home", "/en"],
    ["/it", "it", "Ops, questa pagina è inciampata", "Vai alla home", "/it"],
    [
      "/sl/map",
      "sl",
      "Ups, ta stran se je spotaknila",
      "Na začetno stran",
      "/sl",
    ],
    [
      "/de/dashboard",
      "de",
      "Hoppla, diese Seite ist gestolpert",
      "Zur Startseite",
      "/de",
    ],
  ])("reads %s as %s", (path, locale, title, home, homeHref) => {
    renderAt(path);

    expect(document.documentElement).toHaveAttribute("lang", locale);
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: home })).toHaveAttribute(
      "href",
      homeHref,
    );
  });

  it("retries and reports the error with the digest as a tag", async () => {
    const user = userEvent.setup();
    const { error, retry } = renderAt("/en");

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(retry).toHaveBeenCalledOnce();
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { digest: "9001" },
    });
  });

  it("reloads once instead of reporting a chunk left behind by a deploy", () => {
    pathname.current = "/";
    vi.mocked(Sentry.captureException).mockClear();
    const error = Object.assign(new Error("Loading chunk 6506 failed."), {
      name: "ChunkLoadError",
    });

    render(<GlobalError error={error} retry={vi.fn()} />, {
      container: document,
    });

    expect(reload).toHaveBeenCalledOnce();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
