import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SectionJumpNav from "@/components/custom/common/section-jump-nav";
import { renderWithProviders } from "@/test/render";
import { stubIntersectionObserver } from "@/test/fake-intersection-observer";
import type { ISectionJumpNavItem } from "@/typings/section-jump-nav";

const SECTIONS: ISectionJumpNavItem[] = [
  { id: "products", label: "Proizvodi", count: 0 },
  { id: "stores", label: "Trgovine", count: 3 },
];

function renderNav(sections = SECTIONS) {
  renderWithProviders(
    <>
      <SectionJumpNav label="Odjeljci popisa" sections={sections} />
      {sections.map((section) => (
        <section key={section.id} id={section.id} tabIndex={-1} />
      ))}
    </>,
  );
}

function stubReducedMotion(isReduced: boolean) {
  vi.stubGlobal("matchMedia", () => ({ matches: isReduced }));
}

describe("SectionJumpNav", () => {
  beforeEach(() => {
    stubIntersectionObserver();
    window.history.replaceState(null, "", "/");
  });

  it("renders nothing for a single section", () => {
    renderNav([SECTIONS[0]]);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("links every section and marks the first as current", () => {
    renderNav();

    const nav = screen.getByRole("navigation", { name: "Odjeljci popisa" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Proizvodi" })).toHaveAttribute(
      "href",
      "#products",
    );
    expect(screen.getByRole("link", { name: "Proizvodi" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(
      screen.getByRole("link", { name: "Trgovine 3" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("hides a zero count and names a link with its count", () => {
    renderNav();

    expect(screen.getByRole("link", { name: "Proizvodi" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Trgovine 3" })).toHaveAttribute(
      "href",
      "#stores",
    );
  });

  it("jumps smoothly to a section without adding a history entry", async () => {
    const user = userEvent.setup();
    stubReducedMotion(false);
    renderNav();
    const stores = document.getElementById("stores") as HTMLElement;
    stores.scrollIntoView = vi.fn();
    const historyLength = window.history.length;

    await user.click(screen.getByRole("link", { name: "Trgovine 3" }));

    expect(stores.scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      behavior: "smooth",
    });
    expect(stores).toHaveFocus();
    expect(window.location.hash).toBe("#stores");
    expect(window.history.length).toBe(historyLength);
    expect(screen.getByRole("link", { name: "Trgovine 3" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("link", { name: "Proizvodi" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("jumps without animation when motion is reduced", async () => {
    const user = userEvent.setup();
    stubReducedMotion(true);
    renderNav();
    const stores = document.getElementById("stores") as HTMLElement;
    stores.scrollIntoView = vi.fn();

    await user.click(screen.getByRole("link", { name: "Trgovine 3" }));

    expect(stores.scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      behavior: "instant",
    });
  });

  it("jumps from the keyboard", async () => {
    const user = userEvent.setup();
    stubReducedMotion(false);
    renderNav();
    const stores = document.getElementById("stores") as HTMLElement;
    stores.scrollIntoView = vi.fn();

    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");

    expect(stores.scrollIntoView).toHaveBeenCalled();
    expect(stores).toHaveFocus();
  });
});
