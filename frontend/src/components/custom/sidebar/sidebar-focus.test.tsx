import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SearchBar from "@/components/custom/search/search-bar";
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { CameraScannerProvider } from "@/context/scanner-context";
import { renderWithProviders } from "@/test/render";
import type { IScannedCode } from "@/typings/scanned-code";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const mobile = vi.hoisted(() => ({ closeDrawer: () => {} }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/watchlist",
  useRouter: () => router,
}));
vi.mock("@/components/scanner/scanner-content", () => ({
  default: ({ onScan }: { onScan: (code: IScannedCode) => void }) => (
    <button
      type="button"
      onClick={() => onScan({ rawValue: "3850102127252" } as IScannedCode)}
    >
      Fake scan
    </button>
  ),
}));

// The sidebar's links close it from an effect on the new path, which reaches setOpen the same way.
function ClosingLink() {
  const { setOpen } = useSidebar();

  return (
    <button type="button" onClick={() => setOpen(false)}>
      Link
    </button>
  );
}

// A navigation closes the mobile drawer; the router mock stands in for it. The extra
// button opens it from somewhere other than the trigger, so the drawer's own focus
// restore cannot hide a missing handoff.
function DrawerControls() {
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    mobile.closeDrawer = () => setOpenMobile(false);
  }, [setOpenMobile]);

  return (
    <button type="button" onClick={() => setOpenMobile(true)}>
      Open drawer
    </button>
  );
}

function shell(allowScanning = true) {
  return (
    <SidebarProvider defaultOpen>
      <CameraScannerProvider>
        <SidebarTrigger />
        <DrawerControls />
        <SearchBar
          searchRoute="/products"
          placeholder="Page"
          submitButtonLocation="none"
        />
        <Sidebar>
          <SearchBar
            searchRoute="/products"
            placeholder="Sidebar"
            submitButtonLocation="none"
            allowScanning={allowScanning}
          />
          <ClosingLink />
        </Sidebar>
      </CameraScannerProvider>
    </SidebarProvider>
  );
}

function renderShell() {
  renderWithProviders(shell());

  return {
    trigger: screen.getByRole("button", {
      name: "Prikaži ili sakrij bočnu traku",
    }),
    sidebarField: screen.getByRole("searchbox", { name: "Sidebar" }),
    pageField: screen.getByRole("searchbox", { name: "Page" }),
    container: screen
      .getByRole("searchbox", { name: "Sidebar" })
      .closest("[data-slot=sidebar-container]"),
  };
}

describe("focus when the sidebar closes", () => {
  beforeEach(() => {
    router.push.mockClear();
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("moves to the trigger after a search from inside it", async () => {
    const user = userEvent.setup();
    const { trigger, sidebarField, container } = renderShell();

    await user.type(sidebarField, "sir{Enter}");

    expect(router.push).toHaveBeenCalledWith("/products?q=sir");
    expect(container).toHaveAttribute("inert");
    expect(trigger).toHaveFocus();
  });

  it("ignores an Enter still held from the search on the trigger", () => {
    const { trigger } = renderShell();

    const isDefaultAllowed = fireEvent.keyDown(trigger, {
      key: "Enter",
      repeat: true,
    });

    expect(isDefaultAllowed).toBe(false);
  });

  it("moves to the trigger after a link inside it closes it", async () => {
    const user = userEvent.setup();
    const { trigger, container } = renderShell();

    await user.click(screen.getByRole("button", { name: "Link" }));

    expect(container).toHaveAttribute("inert");
    expect(trigger).toHaveFocus();
  });

  it("moves to the trigger after a scan started inside it", async () => {
    const user = userEvent.setup();
    const { trigger, container } = renderShell();

    await user.click(screen.getByRole("button", { name: "Skeniraj barkod" }));
    await user.click(await screen.findByRole("button", { name: "Fake scan" }));

    expect(container).toHaveAttribute("inert");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("leaves the trigger alone when the scanner is cancelled", async () => {
    const user = userEvent.setup();
    const { trigger, container } = renderShell();

    await user.click(screen.getByRole("button", { name: "Skeniraj barkod" }));
    await screen.findByRole("button", { name: "Fake scan" });
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(container).not.toHaveAttribute("inert");
    expect(trigger).not.toHaveFocus();
  });

  it("falls back to the sidebar field when the scan button is gone", async () => {
    const { rerender } = renderWithProviders(shell());
    const sidebarField = screen.getByRole("searchbox", { name: "Sidebar" });

    fireEvent.click(screen.getByRole("button", { name: "Skeniraj barkod" }));
    await screen.findByRole("button", { name: "Fake scan" });
    rerender(shell(false));
    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(sidebarField).toHaveFocus();
  });

  it("stays in a field outside the sidebar that searched", async () => {
    const user = userEvent.setup();
    const { pageField, container } = renderShell();

    await user.type(pageField, "sir{Enter}");

    expect(container).toHaveAttribute("inert");
    expect(pageField).toHaveFocus();
  });

  describe("on a phone, where the sidebar is a drawer", () => {
    beforeEach(() => {
      vi.stubGlobal("innerWidth", 500);
      router.push.mockImplementation(() => mobile.closeDrawer());
    });

    it("moves to the trigger after a scan started inside the drawer", async () => {
      const user = userEvent.setup();
      renderWithProviders(shell());
      const trigger = screen.getByRole("button", {
        name: "Prikaži ili sakrij bočnu traku",
      });

      await user.click(screen.getByRole("button", { name: "Open drawer" }));
      await user.click(
        await screen.findByRole("button", { name: "Skeniraj barkod" }),
      );
      await user.click(
        await screen.findByRole("button", { name: "Fake scan" }),
      );

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(trigger).toHaveFocus();
    });
  });
});
