import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { renderWithProviders } from "@/test/render";

function renderSidebar(
  defaultOpen: boolean,
  collapsible?: "offcanvas" | "icon",
) {
  renderWithProviders(
    <SidebarProvider defaultOpen={defaultOpen}>
      <Sidebar collapsible={collapsible}>
        <input aria-label="Pretraži" />
      </Sidebar>
    </SidebarProvider>,
  );

  return screen
    .getByLabelText("Pretraži")
    .closest("[data-slot=sidebar-container]");
}

describe("Sidebar on desktop", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });

  it("takes its off-screen contents out of the tab order when closed", () => {
    expect(renderSidebar(false)).toHaveAttribute("inert");
  });

  it("leaves its contents reachable when open", () => {
    expect(renderSidebar(true)).not.toHaveAttribute("inert");
  });

  it("leaves a collapsed icon rail reachable, since it stays on screen", () => {
    expect(renderSidebar(false, "icon")).not.toHaveAttribute("inert");
  });
});
