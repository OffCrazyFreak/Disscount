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

function recordProfileDeletes() {
  const authorizations: (string | null)[] = [];
  server.use(
    // better-auth mints a backend token only while the session cookie is alive.
    http.get("*/api/auth/token", () =>
      auth.sessionToken
        ? HttpResponse.json({ token: auth.sessionToken })
        : HttpResponse.json(null, { status: 401 }),
    ),
    http.delete("*/api/users/me", ({ request }) => {
      authorizations.push(request.headers.get("Authorization"));
      return HttpResponse.json({ message: "ok" });
    }),
  );
  return authorizations;
}

describe("useSecurityActions deleteAccount", () => {
  it("leaves the profile alone when better-auth refuses a stale session", async () => {
    auth.sessionToken = "session-jwt";
    auth.deleteUser.mockResolvedValue({
      error: { code: "SESSION_EXPIRED", message: "Session expired" },
    });
    const profileDeletes = recordProfileDeletes();

    const { result } = renderHookWithProviders(() => useSecurityActions());
    await result.current.deleteAccount();

    expect(profileDeletes).toEqual([]);
    expect(logout).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledOnce();
  });

  it("erases the profile after the identity, with a token taken while the session lived", async () => {
    auth.sessionToken = "session-jwt";
    const profileDeletes = recordProfileDeletes();
    let profileDeletesBeforeIdentity: number | undefined;
    auth.deleteUser.mockImplementation(async () => {
      profileDeletesBeforeIdentity = profileDeletes.length;
      auth.sessionToken = null;
      return { error: null };
    });

    const { result } = renderHookWithProviders(() => useSecurityActions());
    await result.current.deleteAccount();

    expect(profileDeletesBeforeIdentity).toBe(0);
    expect(profileDeletes).toEqual(["Bearer session-jwt"]);
    expect(logout).toHaveBeenCalledOnce();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("drops this tab's cached token once the identity is gone", async () => {
    const encode = (value: object) =>
      btoa(JSON.stringify(value)).replace(/=+$/, "");
    const cachedJwt = `${encode({ alg: "none" })}.${encode({ exp: Math.floor(Date.now() / 1000) + 600 })}.signature`;
    auth.sessionToken = cachedJwt;
    const profileDeletes = recordProfileDeletes();
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

    expect(profileDeletes).toEqual([`Bearer ${cachedJwt}`]);
    expect(laterAuthorizations).toEqual([`Bearer ${cachedJwt}`, null]);
  });

  it("deletes nothing when no backend token can be had", async () => {
    auth.sessionToken = null;
    const profileDeletes = recordProfileDeletes();

    const { result } = renderHookWithProviders(() => useSecurityActions());
    await result.current.deleteAccount();

    expect(auth.deleteUser).not.toHaveBeenCalled();
    expect(profileDeletes).toEqual([]);
    expect(toastError).toHaveBeenCalledOnce();
  });
});
