import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MapSearch from "@/app/[locale]/map/components/map-search";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CameraScannerProvider } from "@/context/scanner-context";
import { renderWithProviders } from "@/test/render";

// Boundaries the suite cannot run: the App Router and the camera.
vi.mock("@/components/scanner/camera-scanner", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/map",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function renderAtWidth(width: number) {
  vi.stubGlobal("innerWidth", width);
  vi.stubGlobal("matchMedia", () => ({
    matches: width < 768,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));

  renderWithProviders(
    <SidebarProvider>
      <CameraScannerProvider>
        <MapSearch />
      </CameraScannerProvider>
    </SidebarProvider>,
  );

  return screen.getByRole("searchbox");
}

describe("MapSearch", () => {
  it("shows the short placeholder on phones and keeps the full accessible name", () => {
    const field = renderAtWidth(360);

    expect(field).toHaveAttribute("placeholder", "Trgovina");
    expect(field).toHaveAccessibleName("Trgovina, grad ili adresa");
  });

  it("shows the full placeholder from the phone breakpoint up", () => {
    const field = renderAtWidth(768);

    expect(field).toHaveAttribute("placeholder", "Trgovina, grad ili adresa");
    expect(field).toHaveAccessibleName("Trgovina, grad ili adresa");
  });
});
