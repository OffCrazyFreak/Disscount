import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SectionTabs from "@/components/custom/common/section-tabs";
import SkipLink, {
  MAIN_CONTENT_ID,
} from "@/components/custom/common/skip-link";
import { renderWithProviders } from "@/test/render";
import type { ISectionTab } from "@/typings/section-tabs";

const TABS: ISectionTab[] = [
  { id: "products", label: "Proizvodi", count: 0, content: <p>Popis</p> },
  { id: "stores", label: "Trgovine", count: 3, content: <p>Usporedba</p> },
];

function renderPage(content = <p>Sadržaj</p>) {
  renderWithProviders(
    <>
      <SkipLink />

      <main id={MAIN_CONTENT_ID} tabIndex={-1}>
        {content}
      </main>
    </>,
  );
}

async function skipToContent() {
  const user = userEvent.setup();

  await user.tab();
  await user.keyboard("{Enter}");
}

describe("SkipLink", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");

    // jsdom has no layout, so it does not implement scrolling an element into view.
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("links to the main content with the Croatian label", () => {
    renderWithProviders(<SkipLink />);

    expect(
      screen.getByRole("link", { name: "Preskoči na sadržaj" }),
    ).toHaveAttribute("href", `#${MAIN_CONTENT_ID}`);
  });

  it("uses the active locale", () => {
    renderWithProviders(<SkipLink />, { locale: "en" });

    expect(
      screen.getByRole("link", { name: "Skip to main content" }),
    ).toBeInTheDocument();
  });

  it("moves focus to the main content and scrolls it into view", async () => {
    renderPage();

    await skipToContent();

    const main = document.getElementById(MAIN_CONTENT_ID);
    expect(main).toHaveFocus();
    expect(main?.scrollIntoView).toHaveBeenCalled();
  });

  it("keeps the URL hash that holds the open tab", async () => {
    window.history.replaceState(null, "", "/#stores");
    renderPage(<SectionTabs label="Odjeljci popisa" tabs={TABS} />);

    await skipToContent();

    expect(window.location.hash).toBe("#stores");
    expect(screen.getByRole("tab", { name: /Trgovine/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
