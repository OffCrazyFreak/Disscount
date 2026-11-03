import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import * as Sentry from "@sentry/nextjs";
import { describe, expect, it, vi } from "vitest";

import { UserProvider, useUser } from "@/context/user-context";
import apiClient, { setAuthTokenUser } from "@/lib/api/api-base";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

const { session } = vi.hoisted(() => ({
  session: {
    userId: "user-a" as string | null,
    error: null as Error | null,
  },
}));

// Only useSession is faked; the token request stays real so MSW answers it.
vi.mock("@/lib/auth/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/client")>();
  return {
    authClient: actual.authClient,
    useSession: () => ({
      data: session.userId ? { user: { id: session.userId } } : null,
      isPending: false,
      error: session.error,
    }),
  };
});

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/offline/purge", () => ({ purgeOfflineCache: vi.fn() }));

vi.mock("@sentry/nextjs", () => ({ setUser: vi.fn() }));

function unsignedJwt(sub: string): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=+$/, "");
  const exp = Math.floor(Date.now() / 1000) + 600;
  return `${encode({ alg: "none" })}.${encode({ sub, exp })}.signature`;
}

const tokenA = unsignedJwt("user-a");
const tokenB = unsignedJwt("user-b");

function SignInButton() {
  const { handleUserLogin } = useUser();
  return <button onClick={() => handleUserLogin()}>sign in</button>;
}

function recordProfileRequests(issueToken: () => Promise<string>) {
  const authorizations: (string | null)[] = [];
  server.use(
    http.get("*/api/auth/token", async () =>
      HttpResponse.json({ token: await issueToken() }),
    ),
    http.get("*/api/users/me", ({ request }) => {
      const authorization = request.headers.get("Authorization");
      authorizations.push(authorization);
      if (!authorization) return HttpResponse.json(null, { status: 401 });
      return HttpResponse.json({
        id: "profile",
        pinnedStores: [],
        pinnedPlaces: [],
      });
    }),
  );
  return authorizations;
}

describe("UserProvider backend token", () => {
  it("stops sending the previous account's token after the session switches account", async () => {
    session.userId = "user-a";
    session.error = null;
    let currentToken = tokenA;
    const authorizations = recordProfileRequests(async () => currentToken);

    const view = renderWithProviders(
      <UserProvider>
        <></>
      </UserProvider>,
    );
    await waitFor(() => expect(authorizations).toEqual([`Bearer ${tokenA}`]));

    session.userId = "user-b";
    currentToken = tokenB;
    view.rerender(
      <UserProvider>
        <></>
      </UserProvider>,
    );

    await waitFor(() => expect(authorizations).toHaveLength(2));
    expect(authorizations[1]).toBe(`Bearer ${tokenB}`);
  });

  it("never attaches a token minted for the previous account that arrives after the switch", async () => {
    session.userId = "user-a";
    session.error = null;
    const pendingTokenA: { release?: (token: string) => void } = {};
    let issueToken = () =>
      new Promise<string>((resolve) => {
        pendingTokenA.release = resolve;
      });
    const authorizations = recordProfileRequests(() => issueToken());

    const view = renderWithProviders(
      <UserProvider>
        <></>
      </UserProvider>,
    );
    await waitFor(() => expect(pendingTokenA.release).toBeDefined());

    session.userId = "user-b";
    view.rerender(
      <UserProvider>
        <></>
      </UserProvider>,
    );
    issueToken = async () => tokenB;
    pendingTokenA.release?.(tokenA);

    // The load that waited on A's token goes out bare and retries with B's after the 401.
    await waitFor(() =>
      expect(
        authorizations.filter((header) => header === `Bearer ${tokenB}`),
      ).toHaveLength(2),
    );
    expect(authorizations).not.toContain(`Bearer ${tokenA}`);
  });

  it("fetches a new token for a request made after the switch instead of reusing the previous account's fetch", async () => {
    session.userId = "user-a";
    session.error = null;
    const pendingTokenA: { release?: (token: string) => void } = {};
    let issueToken = () =>
      new Promise<string>((resolve) => {
        pendingTokenA.release = resolve;
      });
    const authorizations = recordProfileRequests(() => issueToken());
    const probeAuthorizations: (string | null)[] = [];
    // Answers anonymous callers too, like the shared shopping list routes, so nothing retries.
    server.use(
      http.get("*/api/probe", ({ request }) => {
        probeAuthorizations.push(request.headers.get("Authorization"));
        return HttpResponse.json({});
      }),
    );

    const view = renderWithProviders(
      <UserProvider>
        <></>
      </UserProvider>,
    );
    await waitFor(() => expect(pendingTokenA.release).toBeDefined());

    session.userId = "user-b";
    issueToken = async () => tokenB;
    view.rerender(
      <UserProvider>
        <></>
      </UserProvider>,
    );
    const probe = apiClient.get("/api/probe");
    pendingTokenA.release?.(tokenA);
    await probe;

    // Lets both profile loads finish first, so none lands in the next test.
    await waitFor(() =>
      expect(
        authorizations.filter((header) => header === `Bearer ${tokenB}`),
      ).toHaveLength(2),
    );
    expect(probeAuthorizations).toEqual([`Bearer ${tokenB}`]);
  });

  it("keeps the token fetch that began before the first session resolved", async () => {
    let tokenRequests = 0;
    const pendingToken: { release?: (token: string) => void } = {};
    const probeAuthorizations: (string | null)[] = [];
    server.use(
      http.get("*/api/auth/token", async () => {
        tokenRequests += 1;
        const token = await new Promise<string>((resolve) => {
          pendingToken.release = resolve;
        });
        return HttpResponse.json({ token });
      }),
      http.get("*/api/probe", ({ request }) => {
        probeAuthorizations.push(request.headers.get("Authorization"));
        return HttpResponse.json({});
      }),
    );

    const probeBeforeSession = apiClient.get("/api/probe");
    await waitFor(() => expect(pendingToken.release).toBeDefined());
    setAuthTokenUser("user-a");
    const probeAfterSession = apiClient.get("/api/probe");
    pendingToken.release?.(tokenA);
    await Promise.all([probeBeforeSession, probeAfterSession]);

    expect(probeAuthorizations).toEqual([
      `Bearer ${tokenA}`,
      `Bearer ${tokenA}`,
    ]);
    expect(tokenRequests).toBe(1);
  });

  it("waits out the cooldown after refusing another account's token instead of fetching on every request", async () => {
    let tokenRequests = 0;
    const authorizations = recordProfileRequests(async () => {
      tokenRequests += 1;
      return tokenA;
    });
    server.use(http.get("*/api/probe", () => HttpResponse.json({})));
    setAuthTokenUser("user-b");
    // A frozen clock keeps every call inside the cooldown however slow the run.
    vi.useFakeTimers({ toFake: ["Date"] });

    try {
      await apiClient.get("/api/probe");
      await apiClient.get("/api/probe");
      // Login-required calls answer 401, and their retry must not force a fetch either.
      await expect(apiClient.get("/api/users/me")).rejects.toThrow();
      await expect(apiClient.get("/api/users/me")).rejects.toThrow();
    } finally {
      vi.useRealTimers();
    }

    expect(tokenRequests).toBe(1);
    expect(authorizations).toEqual([null, null]);
  });

  it("attaches the new account's token when sign-in reloads the profile before the session lands", async () => {
    session.userId = null;
    session.error = null;
    const authorizations = recordProfileRequests(async () => tokenB);

    renderWithProviders(
      <UserProvider>
        <SignInButton />
      </UserProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "sign in" }));

    await waitFor(() => expect(authorizations).toHaveLength(1));
    expect(authorizations[0]).toBe(`Bearer ${tokenB}`);
  });

  it("attaches the token on a load whose session lookup failed rather than signed out", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    session.userId = null;
    session.error = new Error("offline");
    const authorizations = recordProfileRequests(async () => tokenA);

    renderWithProviders(
      <UserProvider>
        <></>
      </UserProvider>,
    );
    // Past the cooldown the signed-out branch starts, which a failed lookup also takes.
    try {
      vi.setSystemTime(Date.now() + 3_000);
      await apiClient.get("/api/users/me");
    } finally {
      vi.useRealTimers();
    }

    expect(authorizations).toEqual([`Bearer ${tokenA}`]);
  });

  it("keeps refusing another account's token when sign-in finishes after the session landed", async () => {
    session.userId = "user-b";
    session.error = null;
    let currentToken = tokenB;
    const authorizations = recordProfileRequests(async () => currentToken);

    renderWithProviders(
      <UserProvider>
        <SignInButton />
      </UserProvider>,
    );
    await waitFor(() => expect(authorizations).toEqual([`Bearer ${tokenB}`]));

    currentToken = tokenA;
    fireEvent.click(screen.getByRole("button", { name: "sign in" }));

    await waitFor(() => expect(authorizations.length).toBeGreaterThan(1));
    expect(authorizations).not.toContain(`Bearer ${tokenA}`);
  });
});

function SignOutButton() {
  const { logout } = useUser();
  return <button onClick={() => logout()}>sign out</button>;
}

describe("UserProvider Sentry user", () => {
  it("tags Sentry with the account id only and clears it once signed out", async () => {
    session.userId = "user-a";
    session.error = null;
    recordProfileRequests(async () => tokenA);
    vi.mocked(Sentry.setUser).mockClear();

    const view = renderWithProviders(
      <UserProvider>
        <></>
      </UserProvider>,
    );
    await waitFor(() =>
      expect(Sentry.setUser).toHaveBeenLastCalledWith({ id: "user-a" }),
    );

    session.userId = null;
    view.rerender(
      <UserProvider>
        <></>
      </UserProvider>,
    );

    await waitFor(() => expect(Sentry.setUser).toHaveBeenLastCalledWith(null));
  });

  it("clears the Sentry user on sign out before the session catches up", async () => {
    session.userId = "user-a";
    session.error = null;
    recordProfileRequests(async () => tokenA);
    server.use(
      http.post("*/api/auth/sign-out", () =>
        HttpResponse.json({ success: true }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <UserProvider>
        <SignOutButton />
      </UserProvider>,
    );
    await waitFor(() =>
      expect(Sentry.setUser).toHaveBeenLastCalledWith({ id: "user-a" }),
    );

    await user.click(screen.getByRole("button", { name: "sign out" }));

    await waitFor(() => expect(Sentry.setUser).toHaveBeenLastCalledWith(null));
  });
});

describe("UserProvider erased account", () => {
  function answerProfileWithAccountErased({
    sessionUserId = "user-a",
    deleteAnswer = { status: 200, body: { success: true } as object },
  } = {}) {
    const authCalls: string[] = [];
    server.use(
      http.get("*/api/auth/token", () => HttpResponse.json({ token: tokenA })),
      http.get("*/api/users/me", () =>
        HttpResponse.json(
          { code: "account_erased", userId: "user-a" },
          { status: 410 },
        ),
      ),
      http.get("*/api/auth/get-session", () => {
        authCalls.push("get-session");
        return HttpResponse.json({
          user: { id: sessionUserId },
          session: { userId: sessionUserId },
        });
      }),
      http.post("*/api/auth/delete-user", () => {
        authCalls.push("delete-user");
        return HttpResponse.json(deleteAnswer.body, {
          status: deleteAnswer.status,
        });
      }),
      http.post("*/api/auth/sign-out", () => {
        authCalls.push("sign-out");
        return HttpResponse.json({ success: true });
      }),
    );
    return authCalls;
  }

  async function renderAndSettle(authCalls: string[], expected: string[]) {
    vi.spyOn(console, "error").mockImplementation(() => {});
    session.userId = "user-a";
    session.error = null;

    renderWithProviders(<UserProvider>{null}</UserProvider>);

    await waitFor(() => expect(authCalls).toEqual(expected));
    // Lets a stray extra call land before the final check.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(authCalls).toEqual(expected);
  }

  it("finishes the deletion when Spring says the account was already erased", async () => {
    const authCalls = answerProfileWithAccountErased();

    await renderAndSettle(authCalls, ["get-session", "delete-user"]);
  });

  it("signs out when the surviving login is too old to delete", async () => {
    const authCalls = answerProfileWithAccountErased({
      deleteAnswer: { status: 400, body: { code: "SESSION_EXPIRED" } },
    });

    await renderAndSettle(authCalls, [
      "get-session",
      "delete-user",
      "sign-out",
    ]);
  });

  it("stays signed in when the retry fails for another reason", async () => {
    const authCalls = answerProfileWithAccountErased({
      deleteAnswer: { status: 500, body: { code: "INTERNAL_SERVER_ERROR" } },
    });

    await renderAndSettle(authCalls, ["get-session", "delete-user"]);
  });

  it("never deletes an account the session cookie no longer names", async () => {
    const authCalls = answerProfileWithAccountErased({
      sessionUserId: "user-b",
    });

    await renderAndSettle(authCalls, ["get-session"]);
  });
});
