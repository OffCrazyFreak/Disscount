import { act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSecuritySettings } from "@/components/custom/settings/security/hooks/use-security-settings";
import { renderHookWithProviders } from "@/test/render";

const session = vi.hoisted(() => ({ email: "old@example.com" }));

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ user: { email: session.email }, refreshUser: vi.fn() }),
}));

// The Sigurnost tab is closed, so no email input is registered with the form.
function renderClosedTab() {
  session.email = "old@example.com";
  return renderHookWithProviders(() => useSecuritySettings(false));
}

describe("useSecuritySettings", () => {
  it("follows an account email change while the email field is not mounted", () => {
    const { result, rerender } = renderClosedTab();

    session.email = "new@example.com";
    rerender();

    expect(result.current.form.getValues("email")).toBe("new@example.com");
    expect(result.current.form.formState.defaultValues?.email).toBe(
      "new@example.com",
    );
  });

  it("resets to the current account email, not the one it started with", () => {
    const { result, rerender } = renderClosedTab();

    session.email = "new@example.com";
    rerender();
    act(() => result.current.form.reset());

    expect(result.current.form.getValues("email")).toBe("new@example.com");
  });

  it("discards typed edits on reset", () => {
    const { result, rerender } = renderClosedTab();

    act(() => {
      result.current.form.setValue("email", "typed@example.com", {
        shouldDirty: true,
      });
      result.current.form.setValue("newPassword", "secret123", {
        shouldDirty: true,
      });
    });
    session.email = "new@example.com";
    rerender();
    act(() => result.current.form.reset());

    expect(result.current.form.getValues()).toEqual({
      email: "new@example.com",
      newPassword: "",
      currentPassword: "",
    });
  });

  it("keeps a typed email when the account email changes underneath", () => {
    const { result, rerender } = renderClosedTab();

    act(() =>
      result.current.form.setValue("email", "typed@example.com", {
        shouldDirty: true,
      }),
    );
    session.email = "new@example.com";
    rerender();

    expect(result.current.form.getValues("email")).toBe("typed@example.com");
    expect(result.current.form.getFieldState("email").isDirty).toBe(true);
  });
});
