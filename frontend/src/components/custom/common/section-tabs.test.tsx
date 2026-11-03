import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import SectionTabs from "@/components/custom/common/section-tabs";
import { renderWithProviders } from "@/test/render";
import type { ISectionTab } from "@/typings/section-tabs";

const TABS: ISectionTab[] = [
  { id: "products", label: "Proizvodi", count: 0, content: <p>Popis</p> },
  { id: "stores", label: "Trgovine", count: 3, content: <p>Usporedba</p> },
];

function renderTabs(tabs = TABS) {
  renderWithProviders(<SectionTabs label="Odjeljci popisa" tabs={tabs} />);
}

describe("SectionTabs", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("renders a single section as plain content, without tabs", () => {
    renderTabs([TABS[0]]);

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByText("Popis")).toBeInTheDocument();
  });

  it("opens the first tab and renders only its panel", () => {
    renderTabs();

    expect(
      screen.getByRole("tablist", { name: "Odjeljci popisa" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Proizvodi" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Popis")).toBeInTheDocument();
    expect(screen.queryByText("Usporedba")).not.toBeInTheDocument();
  });

  it("hides a zero count and names a tab with its count", () => {
    renderTabs();

    expect(screen.getByRole("tab", { name: "Trgovine 3" })).toBeInTheDocument();
  });

  it("shows a count of a total and keeps a given spoken name", () => {
    renderTabs([
      {
        ...TABS[0],
        count: 2,
        total: 5,
        accessibleName: "Proizvodi (2/5 kupljeno)",
      },
      TABS[1],
    ]);

    const tab = screen.getByRole("tab", { name: "Proizvodi (2/5 kupljeno)" });
    expect(tab).toHaveTextContent("2/5");
  });

  it("switches panels and writes the tab into the hash", async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByRole("tab", { name: "Trgovine 3" }));

    expect(screen.getByText("Usporedba")).toBeInTheDocument();
    expect(screen.queryByText("Popis")).not.toBeInTheDocument();
    expect(window.location.hash).toBe("#stores");
  });

  it("opens the tab the hash names, and follows a later hash change", () => {
    window.history.replaceState(null, "", "/#stores");
    renderTabs();

    expect(screen.getByText("Usporedba")).toBeInTheDocument();

    act(() => {
      window.history.replaceState(null, "", "/#products");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(screen.getByText("Popis")).toBeInTheDocument();
  });

  it("falls back to the first tab for an unknown or malformed hash", () => {
    window.history.replaceState(null, "", "/#%");
    renderTabs();

    expect(screen.getByText("Popis")).toBeInTheDocument();
  });
});
