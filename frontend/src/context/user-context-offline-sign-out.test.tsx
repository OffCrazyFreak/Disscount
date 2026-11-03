import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserProvider, useUser } from "@/context/user-context";
import {
  getCacheIdentity,
  setCacheIdentity,
} from "@/lib/offline/cache-identity";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";
import {
  getPendingSignOut,
  setPendingSignOut,
} from "@/utils/browser/storage/auth";

const { tab } = vi.hoisted(() => ({
  tab: {
    userId: null as string | null,
    createdAt: new Date(0),
    error: null as Error | null,
  },
}));

// Only useSession is faked; authClient stays real so MSW answers its requests.
vi.mock("@/lib/auth/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/client")>();
  return {
    authClient: actual.authClient,
    useSession: () => ({
      data: tab.userId
        ? {
            user: { id: tab.userId },
            session: { userId: tab.userId, createdAt: tab.createdAt },
          }
        : null,
      isPending: false,
      error: tab.error,
    }),
  };
});

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/offline/purge", () => ({ purgeOfflineCache: vi.fn() }));

vi.mock("@sentry/nextjs", () => ({ setUser: vi.fn() }));

function AccountProbe() {
  const { logout, isAuthenticated, canShowAccountData } = useUser();
  return (
    <>
      <button onClick={() => logout()}>sign out</button>
      <p>{isAuthenticated ? "signed in" : "signed out"}</p>
      <p>{canShowAccountData ? "saved data shown" : "saved data hidden"}</p>
    </>
  );
}

function answerProfile() {
  server.use(
    http.get("*/api/users/me", () =>
      HttpResponse.json({ id: tab.userId, pinnedStores: [], pinnedPlaces: [] }),
    ),
  );
}

afterEach(() => {
  setPendingSignOut(null);
  tab.userId = null;
  tab.error = null;
});

describe("UserProvider sign-out while offline", () => {
  it("leaves the device as nobody's, so pages ask to log in instead of showing an empty account", async () => {
    setCacheIdentity("user-a");
    tab.error = new Error("offline");
    server.use(http.post("*/api/auth/sign-out", () => HttpResponse.error()));

    const user = userEvent.setup();
    renderWithProviders(
      <UserProvider>
        <AccountProbe />
      </UserProvider>,
    );
    expect(screen.getByText("saved data shown")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "sign out" }));

    await waitFor(() =>
      expect(screen.getByText("saved data hidden")).toBeInTheDocument(),
    );
    expect(getCacheIdentity()).toBe("anon");
    expect(getPendingSignOut()).toMatchObject({ userId: "user-a" });
  });

  it("ends the surviving session once back online instead of signing the user back in", async () => {
    setCacheIdentity(null);
    setPendingSignOut({ userId: "user-a", signedOutAt: Date.now() });
    tab.userId = "user-a";
    tab.createdAt = new Date(Date.now() - 60_000);
    answerProfile();
    const signOuts = vi.fn();
    server.use(
      http.post("*/api/auth/sign-out", () => {
        signOuts();
        return HttpResponse.json({ success: true });
      }),
    );

    renderWithProviders(
      <UserProvider>
        <AccountProbe />
      </UserProvider>,
    );

    await waitFor(() => expect(signOuts).toHaveBeenCalledTimes(1));
    expect(getPendingSignOut()).toBeNull();
    expect(screen.getByText("signed out")).toBeInTheDocument();
    expect(getCacheIdentity()).toBe("anon");
  });

  it("keeps a sign-in made after the offline sign-out", async () => {
    setCacheIdentity(null);
    setPendingSignOut({ userId: "user-a", signedOutAt: Date.now() - 60_000 });
    tab.userId = "user-a";
    tab.createdAt = new Date();
    answerProfile();
    const signOuts = vi.fn();
    server.use(
      http.post("*/api/auth/sign-out", () => {
        signOuts();
        return HttpResponse.json({ success: true });
      }),
    );

    renderWithProviders(
      <UserProvider>
        <AccountProbe />
      </UserProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("signed in")).toBeInTheDocument(),
    );
    expect(signOuts).not.toHaveBeenCalled();
    expect(getPendingSignOut()).toBeNull();
  });
});
