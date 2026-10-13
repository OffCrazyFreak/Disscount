import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LocaleSuggestion from "@/components/custom/locale/locale-suggestion";
import { renderWithProviders } from "@/test/render";

const { changeLocale, session } = vi.hoisted(() => ({
  changeLocale: vi.fn(),
  session: { current: null as { user: { locale: string } } | null },
}));

vi.mock("@/lib/auth/client", () => ({
  useSession: () => ({ data: session.current }),
}));

vi.mock("@/components/custom/locale/use-change-locale", () => ({
  useChangeLocale: () => ({ changeLocale, isPending: false }),
}));

function browserLanguages(...languages: string[]) {
  vi.spyOn(navigator, "languages", "get").mockReturnValue(languages);
}

beforeEach(() => {
  session.current = null;
  browserLanguages("hr-HR");
});

describe("LocaleSuggestion", () => {
  it("offers the browser's language on a first visit", async () => {
    browserLanguages("de-AT", "en");
    renderWithProviders(<LocaleSuggestion />);

    const offer = await screen.findByRole("button", {
      name: "Auf Deutsch anzeigen",
    });
    await userEvent.setup().click(offer);

    expect(changeLocale).toHaveBeenCalledWith("de");
  });

  it("prefers the saved choice over the browser", async () => {
    browserLanguages("de-AT");
    document.cookie = "NEXT_LOCALE=en; path=/";
    renderWithProviders(<LocaleSuggestion />);

    expect(
      await screen.findByRole("button", { name: "Show in English" }),
    ).toBeInTheDocument();
  });

  it("stays hidden when the page already matches", () => {
    session.current = { user: { locale: "hr" } };
    browserLanguages("de");
    renderWithProviders(<LocaleSuggestion />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("stays dismissed for the rest of the session", async () => {
    browserLanguages("en-GB");
    const { unmount } = renderWithProviders(<LocaleSuggestion />);

    await userEvent
      .setup()
      .click(
        await screen.findByRole("button", { name: "Zatvori prijedlog jezika" }),
      );
    unmount();
    renderWithProviders(<LocaleSuggestion />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
