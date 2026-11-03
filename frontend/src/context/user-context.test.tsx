import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import * as Sentry from "@sentry/nextjs";
import { describe, expect, it, vi } from "vitest";

import { UserProvider, useUser } from "@/context/user-context";
import apiClient from "@/lib/api/api-base";
import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { actingAs, serverSession } from "@/test/backend-identity";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

const { session } = vi.hoisted(() => ({
  session: {
    userId: "user-a" as string | null,
    error: null as Error | null,
  },
}));

// Only useSession is faked; authClient stays real so MSW answers its requests.
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

function SignInButton() {
  const { handleUserLogin } = useUser();
  return <button onClick={() => handleUserLogin()}>sign in</button>;
}

/** Answers the profile as the account the proxy would act as, and the sign-in's fresh session lookup. */
function recordProfileRequests() {
  const accounts: string[] = [];
  server.use(
    http.get("*/api/auth/get-session", () =>
      HttpResponse.json(
        serverSession.userId
          ? {
              user: { id: serverSession.userId },
              session: { userId: serverSession.userId },
            }
          : null,
      ),
    ),
    http.get("*/api/users/me", ({ request }) => {
      const account = actingAs(request);
      accounts.push(account);
      return HttpResponse.json({
        id: account,
        pinnedStores: [],
        pinnedPlaces: [],
      });
    }),
  );
  return accounts;
}

describe("UserProvider backend proxy pin", () => {
  it("moves the pin to the new account when sign-in reloads the profile before the session lands", async () => {
    session.userId = null;
    session.error = null;
    serverSession.userId = "user-b";
    const accounts = recordProfileRequests();

    renderWithProviders(
      <UserProvider>
        <SignInButton />
      </UserProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "sign in" }));

    await waitFor(() => expect(accounts).toEqual(["user-b"]));
  });

  it("keeps the pin on a load whose session lookup failed rather than signed out", async () => {
    setCacheIdentity("user-a");
    serverSession.userId = "user-a";
    session.userId = null;
    session.error = new Error("offline");
    const accounts = recordProfileRequests();

    renderWithProviders(
      <UserProvider>
        <></>
      </UserProvider>,
    );
    await apiClient.get("/api/users/me");

    expect(accounts).toEqual(["user-a"]);
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
    recordProfileRequests();
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
    recordProfileRequests();
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
