import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSecurityActions } from "@/components/custom/settings/security/security-actions";
import { UserProvider, useUser } from "@/context/user-context";
import apiClient from "@/lib/api/api-base";
import {
  getCacheIdentity,
  setCacheIdentity,
} from "@/lib/offline/cache-identity";
import { purgeOfflineCache } from "@/lib/offline/purge";
import { ANONYMOUS, actingAs, serverSession } from "@/test/backend-identity";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";
import { storedUser } from "@/test/stored-user";

// What this tab's useSession reports. The account the session cookie names on the server
// differs from it only between a change on the server and the tab's next poll.
const { tab } = vi.hoisted(() => ({
  tab: { userId: null as string | null },
}));
const cookie = serverSession;

vi.mock("@/lib/auth/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/client")>();
  return {
    authClient: actual.authClient,
    useSession: () => ({
      data: tab.userId ? { user: { id: tab.userId } } : null,
      isPending: false,
      error: null,
    }),
  };
});

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/offline/purge", () => ({ purgeOfflineCache: vi.fn() }));

/** A backend that answers as whoever the request proves, and records who that was. */
function serveBackend() {
  const seen = {
    profileAttempts: 0,
    profile: [] as string[],
    probe: [] as string[],
  };
  server.use(
    http.post("*/api/auth/sign-out", () => {
      cookie.userId = null;
      return HttpResponse.json({ success: true });
    }),
    http.get("*/api/users/me", ({ request }) => {
      seen.profileAttempts += 1;
      const account = actingAs(request);
      seen.profile.push(account);
      if (account === ANONYMOUS)
        return HttpResponse.json(null, { status: 401 });
      return HttpResponse.json({
        ...storedUser,
        id: account,
        pinnedStores: [],
        pinnedPlaces: [],
      });
    }),
    // Answers anonymous callers too, like the shared shopping list routes, so nothing retries.
    http.get("*/api/probe", ({ request }) => {
      seen.probe.push(actingAs(request));
      return HttpResponse.json({});
    }),
  );
  return seen;
}

function signIn(userId: string) {
  tab.userId = userId;
  cookie.userId = userId;
}

function AccountControls() {
  const { user, logout } = useUser();
  const { deleteAccount } = useSecurityActions();
  return (
    <>
      <p>{user ? `profile ${user.id}` : "signed out"}</p>
      <button onClick={() => logout()}>sign out</button>
      <button onClick={() => deleteAccount({ password: "pw" })}>delete</button>
    </>
  );
}

function renderAccount() {
  const view = renderWithProviders(
    <UserProvider>
      <AccountControls />
    </UserProvider>,
  );
  return {
    ...view,
    rerenderAccount: () =>
      view.rerender(
        <UserProvider>
          <AccountControls />
        </UserProvider>,
      ),
  };
}

beforeEach(() => {
  tab.userId = null;
  cookie.userId = null;
  // The in-memory identity outlives the localStorage the DOM setup clears.
  setCacheIdentity(null);
});

describe("UserProvider account switch", () => {
  it("acts as the new account on every backend call after the switch", async () => {
    signIn("user-a");
    const seen = serveBackend();
    const view = renderAccount();
    expect(await screen.findByText("profile user-a")).toBeInTheDocument();

    signIn("user-b");
    view.rerenderAccount();
    expect(await screen.findByText("profile user-b")).toBeInTheDocument();
    await apiClient.get("/api/probe");

    expect(seen.profile).toEqual(["user-a", "user-b"]);
    expect(seen.probe).toEqual(["user-b"]);
  });

  it("purges the departing account's offline cache and keys the cache to the new one", async () => {
    signIn("user-a");
    serveBackend();
    const view = renderAccount();
    await screen.findByText("profile user-a");
    vi.mocked(purgeOfflineCache).mockClear();

    signIn("user-b");
    view.rerenderAccount();
    await screen.findByText("profile user-b");

    expect(purgeOfflineCache).toHaveBeenCalledOnce();
    expect(vi.mocked(purgeOfflineCache).mock.calls[0][1]).toBe("user-a");
    expect(getCacheIdentity()).toBe("user-b");
  });
});

describe("UserProvider behind a sign-in in another tab", () => {
  it("never acts as the account the cookie names until the tab learns of it", async () => {
    tab.userId = "user-a";
    cookie.userId = "user-b";
    const seen = serveBackend();
    renderAccount();

    await waitFor(() => expect(seen.profileAttempts).toBeGreaterThan(0));
    await expect(apiClient.get("/api/probe")).rejects.toMatchObject({
      response: { status: 401, data: { code: "session_changed" } },
    });

    expect([...seen.profile, ...seen.probe]).not.toContain("user-b");
  });
});

describe("UserProvider leaving an account", () => {
  it("sends no authenticated backend call after sign-out", async () => {
    signIn("user-a");
    const seen = serveBackend();
    const user = userEvent.setup();
    renderAccount();
    await screen.findByText("profile user-a");
    vi.mocked(purgeOfflineCache).mockClear();

    await user.click(screen.getByRole("button", { name: "sign out" }));
    await screen.findByText("signed out");
    await apiClient.get("/api/probe");

    expect(seen.probe).toEqual([ANONYMOUS]);
    expect(purgeOfflineCache).toHaveBeenCalledWith(expect.anything(), "user-a");
  });

  it("sends no authenticated backend call once the tab learns its session was revoked elsewhere", async () => {
    signIn("user-a");
    const seen = serveBackend();
    const view = renderAccount();
    await screen.findByText("profile user-a");

    cookie.userId = null;
    tab.userId = null;
    view.rerenderAccount();
    await screen.findByText("signed out");
    await apiClient.get("/api/probe");

    expect(seen.probe).toEqual([ANONYMOUS]);
  });

  it("sends no authenticated backend call after deleting the account", async () => {
    signIn("user-a");
    const seen = serveBackend();
    server.use(
      http.post("*/api/auth/delete-user", () => {
        cookie.userId = null;
        return HttpResponse.json({ success: true });
      }),
    );
    const user = userEvent.setup();
    renderAccount();
    await screen.findByText("profile user-a");
    await apiClient.get("/api/probe");

    await user.click(screen.getByRole("button", { name: "delete" }));
    await screen.findByText("signed out");
    await apiClient.get("/api/probe");

    expect(seen.probe).toEqual(["user-a", ANONYMOUS]);
    await waitFor(() =>
      expect(purgeOfflineCache).toHaveBeenCalledWith(
        expect.anything(),
        "user-a",
      ),
    );
  });
});
