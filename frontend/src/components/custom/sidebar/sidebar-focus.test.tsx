import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

function renderShell() {
  renderWithProviders(
    <SidebarProvider defaultOpen>
      <CameraScannerProvider>
        <SidebarTrigger />
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
            allowScanning
          />
          <ClosingLink />
        </Sidebar>
      </CameraScannerProvider>
    </SidebarProvider>,
  );

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

  it("stays in a field outside the sidebar that searched", async () => {
    const user = userEvent.setup();
    const { pageField, container } = renderShell();

    await user.type(pageField, "sir{Enter}");

    expect(container).toHaveAttribute("inert");
    expect(pageField).toHaveFocus();
  });
});
