import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PublicModalsOutlet from "@/app/[locale]/components/modal-router/public-modals-outlet";
import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { parseModalParam } from "@/lib/modal/modal-param-parser";
import { renderWithProviders } from "@/test/render";

const { user } = vi.hoisted(() => ({
  user: {
    isAuthenticated: false,
    isLoading: false,
    refreshUser: vi.fn(),
    user: null as { id: string } | null,
  },
}));

vi.mock("@/context/user-context", () => ({ useUser: () => user }));

// better-auth's /verify-email lands a failed link on its callback with &error=<CODE>.
function renderLanding(search: string) {
  window.history.replaceState({}, "", `/${search}`);
  const target = parseModalParam(new URLSearchParams(search));
  return renderWithProviders(<PublicModalsOutlet target={target} />);
}

describe("PublicModalsOutlet verification landings", () => {
  beforeEach(() => {
    user.isAuthenticated = false;
    user.user = null;
  });

  it("shows the confirmation when the link worked", async () => {
    renderLanding("?modal=email-verified");

    const dialog = await screen.findByRole("dialog", {
      name: "Email potvrđen",
    });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it.each(["TOKEN_EXPIRED", "INVALID_TOKEN", "USER_NOT_FOUND"])(
    "offers a new sign-up link instead of success on %s",
    async (code) => {
      renderLanding(`?modal=email-verified&error=${code}`);

      const dialog = await screen.findByRole("dialog", {
        name: "Poveznica više ne vrijedi",
      });
      expect(dialog).toHaveAccessibleDescription(
        "Istekla je ili nije ispravna. Prijavi se i poslat ćemo ti novu.",
      );
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
      expect(screen.queryByText("Email potvrđen")).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Prijavi se" }));
      expect(window.location.search).toBe("?modal=login");
    },
  );

  it("sends a failed change-email link back to security settings", async () => {
    renderLanding("?modal=email-changed&error=TOKEN_EXPIRED");

    await screen.findByRole("dialog", { name: "Poveznica više ne vrijedi" });
    expect(screen.queryByText("Email promijenjen")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Otvori postavke" }),
    );
    expect(window.location.search).toBe("?modal=settings/sigurnost");
  });

  it("closes a failed sign-up link for a signed-in user, with no sign-in step", async () => {
    user.isAuthenticated = true;
    renderLanding("?modal=email-verified&error=TOKEN_EXPIRED");

    await userEvent.click(
      await screen.findByRole("button", { name: "Nastavi" }),
    );
    expect(window.location.search).toBe("");
  });
});

describe("PublicModalsOutlet contact form", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("drops what one account typed when another account signs in", async () => {
    user.user = { id: "account-a" };
    setCacheIdentity("account-a");
    const { rerender } = renderLanding("?modal=contact");
    const target = parseModalParam(new URLSearchParams("?modal=contact"));

    await userEvent.type(
      await screen.findByRole("textbox", { name: /Poruka/ }),
      "Review Shots",
    );
    user.user = { id: "account-b" };
    setCacheIdentity("account-b");
    rerender(<PublicModalsOutlet target={target} />);

    expect(await screen.findByRole("textbox", { name: /Poruka/ })).toHaveValue(
      "",
    );
  });
});
