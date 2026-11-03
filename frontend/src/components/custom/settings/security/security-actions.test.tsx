import { http, HttpResponse } from "msw/http";
import { describe, expect, it, vi } from "vitest";

import { useSecurityActions } from "@/components/custom/settings/security/security-actions";
import apiClient from "@/lib/api/api-base";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";

const { auth, logout, toastError } = vi.hoisted(() => ({
  auth: {
    sessionToken: null as string | null,
    deleteUser: vi.fn(),
  },
  logout: vi.fn(),
  toastError: vi.fn(),
}));

// Only deleteUser is faked; the token request stays real so MSW answers it.
vi.mock("@/lib/auth/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/client")>();
  return {
    authClient: {
      $fetch: actual.authClient.$fetch,
      deleteUser: auth.deleteUser,
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
    http.get("*/api/auth/token", () => {
      calls.push("token");
      return auth.sessionToken
        ? HttpResponse.json({ token: auth.sessionToken })
        : HttpResponse.json(null, { status: 401 });
    }),
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
        code: "INTERNAL_SERVER_ERROR",
        message: "Account erasure failed",
      },
    });
    const calls = recordClientCalls();

    const { result } = renderHookWithProviders(() => useSecurityActions());
    await result.current.deleteAccount();

    expect(calls).toEqual([]);
    expect(logout).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledOnce();
  });

  it("deletes through deleteUser alone, then signs this tab out", async () => {
    auth.sessionToken = "session-jwt";
    auth.deleteUser.mockResolvedValue({ error: null });
    const calls = recordClientCalls();

    const { result } = renderHookWithProviders(() => useSecurityActions());
    await result.current.deleteAccount();

    expect(auth.deleteUser).toHaveBeenCalledOnce();
    expect(calls).toEqual([]);
    expect(logout).toHaveBeenCalledOnce();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("drops this tab's cached token once the identity is gone", async () => {
    const encode = (value: object) =>
      btoa(JSON.stringify(value)).replace(/=+$/, "");
    const cachedJwt = `${encode({ alg: "none" })}.${encode({ exp: Math.floor(Date.now() / 1000) + 600 })}.signature`;
    auth.sessionToken = cachedJwt;
    recordClientCalls();
    const laterAuthorizations: (string | null)[] = [];
    server.use(
      http.get("*/api/probe", ({ request }) => {
        laterAuthorizations.push(request.headers.get("Authorization"));
        return HttpResponse.json({});
      }),
    );
    await apiClient.get("/api/probe");
    auth.deleteUser.mockImplementation(async () => {
      auth.sessionToken = null;
      return { error: null };
    });

    const { result } = renderHookWithProviders(() => useSecurityActions());
    await result.current.deleteAccount();
    await apiClient.get("/api/probe");

    expect(laterAuthorizations).toEqual([`Bearer ${cachedJwt}`, null]);
  });
});
