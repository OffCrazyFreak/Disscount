import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MapSearch from "@/app/[locale]/map/components/map-search";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CameraScannerProvider } from "@/context/scanner-context";
import { renderWithProviders } from "@/test/render";
import { stubTextFit, textWidth } from "@/test/stub-text-fit";

// Boundaries the suite cannot run: the App Router and the camera.
vi.mock("@/components/scanner/camera-scanner", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/map",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// The sidebar still reads the phone breakpoint; the placeholder must not depend on it.
function renderWithFieldWidth(width: number) {
  vi.stubGlobal("innerWidth", 360);
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  stubTextFit(width);

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
  it("shows the short placeholder while the field is too narrow for the full one", () => {
    const field = renderWithFieldWidth(
      textWidth("Trgovina, grad ili adresa") - 1,
    );

    expect(field).toHaveAttribute("placeholder", "Trgovina");
    expect(field).toHaveAccessibleName("Trgovina, grad ili adresa");
  });

  it("shows the full placeholder as soon as the field is wide enough, even on a phone", () => {
    const field = renderWithFieldWidth(textWidth("Trgovina, grad ili adresa"));

    expect(field).toHaveAttribute("placeholder", "Trgovina, grad ili adresa");
    expect(field).toHaveAccessibleName("Trgovina, grad ili adresa");
  });
});
