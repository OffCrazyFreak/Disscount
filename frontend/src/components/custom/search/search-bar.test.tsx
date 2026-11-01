import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SearchBar from "@/components/custom/search/search-bar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CameraScannerProvider } from "@/context/scanner-context";
import { renderWithProviders } from "@/test/render";

const router = vi.hoisted(() => ({
  search: "",
  push: vi.fn(),
  replace: vi.fn(),
}));

// Boundaries the suite cannot run: the App Router and the camera.
vi.mock("@/components/scanner/camera-scanner", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(router.search),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/products",
  useRouter: () => ({ push: router.push, replace: router.replace }),
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
  beforeEach(() => {
    router.search = "";
    router.push.mockClear();
  });

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

  it("closes the touch keyboard on Enter over the query already searched", async () => {
    router.search = "q=mlijeko";
    stubPointer(true);
    const user = userEvent.setup();
    const field = renderSearchBar();

    await user.click(field);
    await user.keyboard("{Enter}");

    expect(field).not.toHaveFocus();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("does not search again on Enter over the same query once scrolled", async () => {
    router.search = "q=mlijeko";
    stubPointer(true);
    // Past the back to top threshold the disabled button becomes a plain button.
    vi.stubGlobal("scrollY", 700);
    const user = userEvent.setup();
    const field = renderSearchBar();

    await user.click(field);
    await user.keyboard("{Enter}");

    expect(field).not.toHaveFocus();
    expect(router.push).not.toHaveBeenCalled();
  });
});
