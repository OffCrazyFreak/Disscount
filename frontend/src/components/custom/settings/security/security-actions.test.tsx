import { http, HttpResponse } from "msw/http";
import { describe, expect, it, vi } from "vitest";

import { useSecurityActions } from "@/components/custom/settings/security/security-actions";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";

const { auth, logout, toastError } = vi.hoisted(() => ({
  auth: { deleteUser: vi.fn() },
  logout: vi.fn(),
  toastError: vi.fn(),
}));

// Only the delete request is faked; anything else stays real so MSW answers it.
vi.mock("@/lib/auth/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/client")>();
  return {
    authClient: {
      $fetch: (path: string, options: { body?: unknown }) =>
        path === "/delete-user"
          ? auth.deleteUser(options.body)
          : actual.authClient.$fetch(path, options),
    },
  };
});

vi.mock("@/context/user-context", () => ({ useUser: () => ({ logout }) }));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { error: toastError, success: vi.fn() },
}));

// The backend erase belongs to the server hook, so the browser must never call it itself.
function recordClientCalls() {
  const calls: string[] = [];
  server.use(
    http.delete("*/api/users/me", () => {
      calls.push("profile delete");
      return HttpResponse.json({ message: "ok" });
    }),
  );
  return calls;
}

describe("useSecurityActions deleteAccount", () => {
  it("leaves this tab signed in when the server refuses the deletion", async () => {
    auth.deleteUser.mockResolvedValue({
      error: {
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message: "Account erasure failed",
      },
    });
    const calls = recordClientCalls();

    const { result } = renderHookWithProviders(() => useSecurityActions());
    const failure = await result.current.deleteAccount({ password: "pw" });

    expect(failure).toEqual({ reason: "failed" });
    expect(calls).toEqual([]);
    expect(logout).not.toHaveBeenCalled();
  });

  it("tells the dialog when the last admin tries to delete their account", async () => {
    auth.deleteUser.mockResolvedValue({
      error: { status: 409, code: "LAST_ADMIN_DELETE" },
    });

    const { result } = renderHookWithProviders(() => useSecurityActions());
    const failure = await result.current.deleteAccount({ password: "pw" });

    expect(failure).toEqual({ reason: "last-admin" });
    expect(logout).not.toHaveBeenCalled();
  });

  it("reports a wrong password to the dialog instead of deleting", async () => {
    auth.deleteUser.mockResolvedValue({
      error: { status: 400, code: "INVALID_PASSWORD" },
    });

    const { result } = renderHookWithProviders(() => useSecurityActions());
    const failure = await result.current.deleteAccount({ password: "pw" });

    expect(failure).toEqual({ reason: "wrong-password" });
    expect(logout).not.toHaveBeenCalled();
  });

  it("sends the emailed code inside the delete request", async () => {
    auth.deleteUser.mockResolvedValue({ error: null });

    const { result } = renderHookWithProviders(() => useSecurityActions());
    await result.current.deleteAccount({ code: "482915" });

    expect(auth.deleteUser).toHaveBeenCalledWith({ code: "482915" });
  });

  it("deletes through deleteUser alone, then signs this tab out", async () => {
    auth.deleteUser.mockResolvedValue({ error: null });
    const calls = recordClientCalls();

    const { result } = renderHookWithProviders(() => useSecurityActions());
    await result.current.deleteAccount({ password: "pw" });

    expect(auth.deleteUser).toHaveBeenCalledWith({ password: "pw" });
    expect(calls).toEqual([]);
    expect(logout).toHaveBeenCalledOnce();
    expect(toastError).not.toHaveBeenCalled();
  });
});
