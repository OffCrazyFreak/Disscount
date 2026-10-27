import { useState } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarProvider } from "@/components/ui/sidebar";
import { CameraScannerProvider } from "@/context/scanner-context";
import MapSearchBar from "@/app/[locale]/map/components/map-search-bar";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

// Boundaries the suite cannot run: the session, the App Router and the camera.
vi.mock("@/context/user-context", () => ({
  useUser: () => ({ isAuthenticated: false, isInitializing: false }),
}));
vi.mock("@/components/scanner/camera-scanner", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/map",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function Harness({ onOuterEscape }: { onOuterEscape: () => void }) {
  const [isOpen, setOpen] = useState(false);

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === "Escape") onOuterEscape();
      }}
    >
      <SidebarProvider>
        <CameraScannerProvider>
          <MapSearchBar isOpen={isOpen} onOpenChange={setOpen}>
            <p>store list</p>
          </MapSearchBar>
        </CameraScannerProvider>
      </SidebarProvider>
    </div>
  );
}

describe("MapSearchBar", () => {
  // jsdom has no matchMedia, which the sidebar asks for the phone breakpoint.
  beforeEach(() => {
    // The language switcher reads the session itself: a signed-out answer.
    server.use(
      http.get("*/api/auth/get-session", () => HttpResponse.json(null)),
    );
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });

  it("opens on a press of the field, and the back arrow closes it", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness onOuterEscape={vi.fn()} />);

    expect(screen.queryByText("store list")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("searchbox", { name: "Trgovina, grad ili adresa..." }),
    );
    expect(await screen.findByText("store list")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Prebaci bočnu traku" }),
      ).toBeNull(),
    );

    await user.click(screen.getByRole("button", { name: "Natrag na kartu" }));
    expect(
      screen.getByRole("searchbox", { name: "Trgovina, grad ili adresa..." }),
    ).not.toHaveFocus();
    expect(
      await screen.findByRole("button", { name: "Prebaci bočnu traku" }),
    ).toBeInTheDocument();
  });

  it("keeps Escape to itself, so an open store sheet stays open", async () => {
    const onOuterEscape = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Harness onOuterEscape={onOuterEscape} />);

    const field = screen.getByRole("searchbox", {
      name: "Trgovina, grad ili adresa...",
    });
    await user.click(field);
    fireEvent.keyDown(field, { key: "Escape" });

    expect(onOuterEscape).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("button", { name: "Prebaci bočnu traku" }),
    ).toBeInTheDocument();
  });

  it("hands focus back to the field when a key closes it", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness onOuterEscape={vi.fn()} />);

    const field = screen.getByRole("searchbox", {
      name: "Trgovina, grad ili adresa...",
    });
    await user.click(field);
    await screen.findByText("store list");

    screen.getByRole("button", { name: "Natrag na kartu" }).focus();
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(screen.queryByText("store list")).not.toBeInTheDocument(),
    );
    expect(field).toHaveFocus();
  });
});
