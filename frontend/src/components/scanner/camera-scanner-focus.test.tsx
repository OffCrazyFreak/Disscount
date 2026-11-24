import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import SearchBar from "@/components/custom/search/search-bar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CameraScannerProvider } from "@/context/scanner-context";
import { renderWithProviders } from "@/test/render";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/products",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/components/scanner/scanner-content", () => ({
  default: () => <p>Fake camera</p>,
}));

function bar(allowScanning: boolean) {
  return (
    <SidebarProvider>
      <CameraScannerProvider>
        <SearchBar
          searchRoute="/products"
          placeholder="Pretraži"
          allowScanning={allowScanning}
        />
      </CameraScannerProvider>
    </SidebarProvider>
  );
}

async function openScanner() {
  const user = userEvent.setup();
  const { rerender } = renderWithProviders(bar(true));
  const scanButton = screen.getByRole("button", { name: "Skeniraj barkod" });

  await user.click(scanButton);
  await screen.findByText("Fake camera");

  return { user, rerender, scanButton };
}

async function expectClosed() {
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
}

describe("focus when the scanner is cancelled", () => {
  it("returns to the scan button on Escape", async () => {
    const { user, scanButton } = await openScanner();

    await user.keyboard("{Escape}");

    await expectClosed();
    expect(scanButton).toHaveFocus();
  });

  it("returns to the scan button from the close button", async () => {
    const { user, scanButton } = await openScanner();

    await user.click(screen.getByRole("button", { name: "Zatvori" }));

    await expectClosed();
    expect(scanButton).toHaveFocus();
  });

  it("returns to the scan button after a click outside the dialog", async () => {
    const { user, scanButton } = await openScanner();

    await user.click(
      document.querySelector<HTMLElement>("[data-slot=dialog-overlay]")!,
    );

    await expectClosed();
    expect(scanButton).toHaveFocus();
  });

  it("falls back to the search field when the scan button is gone", async () => {
    const { user, rerender } = await openScanner();

    rerender(bar(false));
    await user.keyboard("{Escape}");

    await expectClosed();
    expect(screen.getByRole("searchbox", { name: "Pretraži" })).toHaveFocus();
  });

  // Safari does not focus a button on click, so activeElement is the body when the dialog opens.
  describe("when the click leaves focus on the page, as in Safari", () => {
    async function openWithoutFocus() {
      const user = userEvent.setup();
      const { rerender } = renderWithProviders(bar(true));
      const scanButton = screen.getByRole("button", {
        name: "Skeniraj barkod",
      });

      fireEvent.click(scanButton);
      await screen.findByText("Fake camera");

      return { user, rerender, scanButton };
    }

    it("returns to the scan button that was clicked", async () => {
      const { user, scanButton } = await openWithoutFocus();

      await user.keyboard("{Escape}");

      await expectClosed();
      expect(scanButton).toHaveFocus();
    });

    it("falls back to the search field when that button is gone", async () => {
      const { user, rerender } = await openWithoutFocus();

      rerender(bar(false));
      await user.keyboard("{Escape}");

      await expectClosed();
      expect(screen.getByRole("searchbox", { name: "Pretraži" })).toHaveFocus();
    });
  });
});
