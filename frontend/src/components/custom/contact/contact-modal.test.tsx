import type { ReactNode } from "react";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ContactModal from "@/components/custom/contact/contact-modal";
import { renderWithProviders } from "@/test/render";
import { setFormDraft } from "@/utils/browser/local-storage";

const { userState } = vi.hoisted(() => ({
  userState: {
    current: {
      user: null as { email: string; name: string } | null,
      isLoading: true,
    },
  },
}));
vi.mock("@/context/user-context", () => ({
  useUser: () => userState.current,
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/lib/modal/modal-navigation", () => ({ closeModalUrl: vi.fn() }));

const PROFILE = { email: "ana@example.com", name: "Ana Anić" };

describe("ContactModal", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    userState.current = { user: null, isLoading: true };
  });

  it("keeps the profile prefill when a draft is restored before the profile loads", async () => {
    setFormDraft("contact", { subject: "Cijene", message: "Poruka iz nacrta" });

    const view = renderWithProviders(<ContactModal open />);
    userState.current = { user: PROFILE, isLoading: false };
    view.rerender(<ContactModal open />);

    await waitFor(() =>
      expect(screen.getByLabelText("Email")).toHaveValue(PROFILE.email),
    );
    expect(screen.getByLabelText("Ime i prezime")).toHaveValue(PROFILE.name);
    expect(screen.getByLabelText(/Naslov/)).toHaveValue("Cijene");
    expect(screen.getByLabelText(/Poruka/)).toHaveValue("Poruka iz nacrta");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Pošalji poruku" }),
      ).toBeEnabled(),
    );
  });

  it("keeps an edited email when the profile arrives later", async () => {
    setFormDraft("contact", { email: "drugi@example.com", subject: "Cijene" });

    const view = renderWithProviders(<ContactModal open />);
    userState.current = { user: PROFILE, isLoading: false };
    view.rerender(<ContactModal open />);

    await waitFor(() =>
      expect(screen.getByLabelText("Ime i prezime")).toHaveValue(PROFILE.name),
    );
    expect(screen.getByLabelText("Email")).toHaveValue("drugi@example.com");
    expect(screen.getByLabelText(/Naslov/)).toHaveValue("Cijene");
  });

  it("restores a draft the map wrote while the modal was closed", async () => {
    userState.current = { user: PROFILE, isLoading: false };
    const view = renderWithProviders(<ContactModal open />);
    await waitFor(() =>
      expect(screen.getByLabelText("Email")).toHaveValue(PROFILE.email),
    );

    view.rerender(<ContactModal open={false} />);
    setFormDraft("contact", { subject: "Prijava lokacije" });
    view.rerender(<ContactModal open />);

    await waitFor(() =>
      expect(screen.getByLabelText(/Naslov/)).toHaveValue("Prijava lokacije"),
    );
    expect(screen.getByLabelText("Email")).toHaveValue(PROFILE.email);
  });
});
