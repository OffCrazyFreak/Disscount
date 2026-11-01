import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import SearchBar from "@/components/custom/search/search-bar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CameraScannerProvider } from "@/context/scanner-context";
import { renderWithProviders } from "@/test/render";

// Boundaries the suite cannot run: the App Router and the camera.
vi.mock("@/components/scanner/camera-scanner", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/products",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function stubPointer(isCoarse: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(pointer: coarse)" ? isCoarse : false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

function renderSearchBar() {
  renderWithProviders(
    <SidebarProvider>
      <CameraScannerProvider>
        <SearchBar searchRoute="/products" placeholder="Pretraži" />
      </CameraScannerProvider>
    </SidebarProvider>,
  );

  return screen.getByRole("searchbox", { name: "Pretraži" });
}

describe("SearchBar", () => {
  it("closes the touch keyboard when Enter submits the search", async () => {
    stubPointer(true);
    const user = userEvent.setup();
    const field = renderSearchBar();

    await user.type(field, "mlijeko{Enter}");

    expect(field).not.toHaveFocus();
  });

  it("keeps focus in the field on a device with a fine pointer", async () => {
    stubPointer(false);
    const user = userEvent.setup();
    const field = renderSearchBar();

    await user.type(field, "mlijeko{Enter}");

    expect(field).toHaveFocus();
  });
});
