import { describe, expect, it, vi } from "vitest";

import OAuthErrorToast from "@/components/custom/common/oauth-error-toast";
import hr from "@/i18n/messages/hr";
import { renderWithProviders } from "@/test/render";

const { search, toastError } = vi.hoisted(() => ({
  search: { current: "" },
  toastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search.current),
}));

vi.mock("sonner", () => ({ toast: { error: toastError } }));

function renderAt(query: string) {
  search.current = query;
  window.history.replaceState({}, "", `/${query}`);
  renderWithProviders(<OAuthErrorToast />);
}

describe("OAuthErrorToast", () => {
  it("toasts an OAuth error and strips it from the address bar", () => {
    renderAt("?error=account_not_linked");

    expect(toastError).toHaveBeenCalledOnce();
    expect(window.location.search).toBe("");
  });

  it("explains a link refused for a different email address", () => {
    renderAt("?error=email_does_not_match");

    expect(toastError).toHaveBeenCalledWith(
      hr.common.oauthError.emailMismatch,
      expect.anything(),
    );
  });

  it("leaves a failed verification link's error to its status modal", () => {
    renderAt("?modal=email-verified&error=TOKEN_EXPIRED");

    expect(toastError).not.toHaveBeenCalled();
    expect(window.location.search).toBe(
      "?modal=email-verified&error=TOKEN_EXPIRED",
    );
  });
});
