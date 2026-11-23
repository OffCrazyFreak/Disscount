import { act, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import InstallBanner from "@/components/custom/pwa/install-banner";
import {
  releaseInstallBannerHold,
  useInstallBannerHold,
} from "@/components/custom/pwa/install-banner-hold";
import { renderWithProviders } from "@/test/render";

vi.mock("@/i18n/navigation", () => ({ usePathname: () => "/map" }));

// A browser that offered the install prompt, so only the hold can keep the banner away.
vi.mock("@/components/custom/pwa/use-install-prompt", () => ({
  useInstallPrompt: () => ({
    canShowInstallUI: true,
    canInstall: true,
    platform: "desktop",
    promptInstall: vi.fn(),
  }),
}));

function HeldBanner() {
  useInstallBannerHold("map-credits", true);

  return <InstallBanner />;
}

describe("InstallBanner", () => {
  it("stays hidden while the map holds it, and shows once the credits fold", async () => {
    renderWithProviders(<HeldBanner />);

    expect(
      screen.queryByText("Instaliraj Disscount za brži pristup."),
    ).toBeNull();

    act(() => releaseInstallBannerHold("map-credits"));

    expect(
      await screen.findByText("Instaliraj Disscount za brži pristup."),
    ).toBeInTheDocument();
  });
});
