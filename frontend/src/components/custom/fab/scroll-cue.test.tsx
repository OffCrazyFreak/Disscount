import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ScrollCue from "@/components/custom/fab/scroll-cue";
import { renderWithProviders } from "@/test/render";

const session = vi.hoisted(() => ({
  user: null as { id: string } | null,
  isLoading: false,
}));

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ ...session }),
}));

const scrollWindowTo = vi.hoisted(() => vi.fn());

vi.mock("@/utils/scroll", () => ({ scrollWindowTo }));

const LABEL = "Pomakni se niže";

function setPage({
  scrollY,
  pageHeight,
}: {
  scrollY: number;
  pageHeight: number;
}) {
  Object.defineProperty(window, "scrollY", {
    value: scrollY,
    configurable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    value: 800,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: pageHeight,
    configurable: true,
  });
}

function cueButton() {
  return screen.queryByRole("button", { name: LABEL });
}

describe("ScrollCue", () => {
  beforeEach(() => {
    Object.assign(session, { user: null, isLoading: false });
    scrollWindowTo.mockReset();
    setPage({ scrollY: 0, pageHeight: 3000 });
  });

  it("offers a signed-out visitor at the top a way down", () => {
    renderWithProviders(<ScrollCue />);

    expect(cueButton()).not.toHaveAttribute("inert");
  });

  it("scrolls about one screen down when tapped", async () => {
    renderWithProviders(<ScrollCue />);

    await userEvent.setup().click(cueButton()!);

    // jsdom has no measured header, so the step is the screen minus the carried-over sliver.
    expect(scrollWindowTo).toHaveBeenCalledWith(800 - 48);
  });

  it("leaves room for the header it scrolls under", async () => {
    document.documentElement.style.setProperty("--header-bottom", "80px");
    renderWithProviders(<ScrollCue />);

    await userEvent.setup().click(cueButton()!);

    expect(scrollWindowTo).toHaveBeenCalledWith(800 - 80 - 48);
    document.documentElement.style.removeProperty("--header-bottom");
  });

  it("shows nothing to a signed-in user", () => {
    session.user = { id: "a" };
    renderWithProviders(<ScrollCue />);

    expect(cueButton()).not.toBeInTheDocument();
  });

  it("shows nothing while the session is still loading", () => {
    session.isLoading = true;
    renderWithProviders(<ScrollCue />);

    expect(cueButton()).not.toBeInTheDocument();
  });

  it("takes the button out of reach once the page has moved", () => {
    renderWithProviders(<ScrollCue />);

    act(() => {
      setPage({ scrollY: 1, pageHeight: 3000 });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(screen.getByLabelText(LABEL)).toHaveAttribute("inert");
  });

  it("keeps the button out of reach on a page that fits the screen", () => {
    setPage({ scrollY: 0, pageHeight: 800 });
    renderWithProviders(<ScrollCue />);

    expect(screen.getByLabelText(LABEL)).toHaveAttribute("inert");
  });
});
