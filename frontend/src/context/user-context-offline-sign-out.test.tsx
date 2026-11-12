import { tab } from "@/test/user-context-mocks";
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
import { storedUser } from "@/test/stored-user";
import {
  getPendingSignOut,
  setLastSession,
  setPendingSignOut,
} from "@/utils/browser/storage/auth";

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
      HttpResponse.json({
        ...storedUser,
        id: tab.userId,
        pinnedStores: [],
        pinnedPlaces: [],
      }),
    ),
  );
}

afterEach(() => {
  setPendingSignOut(null);
  setLastSession(null);
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
    expect(getPendingSignOut()).toMatchObject({
      userId: "user-a",
      isServerEnded: false,
    });
  });

  it("ends the surviving session once back online instead of signing the user back in", async () => {
    setCacheIdentity(null);
    setPendingSignOut({
      userId: "user-a",
      sessionId: "session-1",
      isServerEnded: false,
    });
    tab.userId = "user-a";
    tab.sessionId = "session-1";
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
    // Kept until a session read shows it gone, so a stale answer cannot sign back in.
    await waitFor(() =>
      expect(getPendingSignOut()).toMatchObject({ isServerEnded: true }),
    );
    expect(screen.getByText("signed out")).toBeInTheDocument();
    expect(getCacheIdentity()).toBe("anon");
  });

  it("sends the sign-out again while the server answers that it is busy", async () => {
    setCacheIdentity(null);
    setPendingSignOut({
      userId: "user-a",
      sessionId: "session-1",
      isServerEnded: false,
    });
    tab.userId = "user-a";
    tab.sessionId = "session-1";
    server.use(
      http.post("*/api/auth/sign-out", () =>
        HttpResponse.json({}, { status: 429 }),
      ),
    );

    renderWithProviders(
      <UserProvider>
        <AccountProbe />
      </UserProvider>,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(getPendingSignOut()).toMatchObject({ isServerEnded: false });
    expect(screen.getByText("signed out")).toBeInTheDocument();
  });

  it("names the session it ends, so the next session of the same account is kept", async () => {
    setCacheIdentity("user-a");
    tab.userId = "user-a";
    tab.sessionId = "session-1";
    answerProfile();
    server.use(http.post("*/api/auth/sign-out", () => HttpResponse.error()));

    const user = userEvent.setup();
    renderWithProviders(
      <UserProvider>
        <AccountProbe />
      </UserProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText("signed in")).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "sign out" }));

    await waitFor(() =>
      expect(getPendingSignOut()).toMatchObject({ sessionId: "session-1" }),
    );
  });

  it("keeps a sign-in made after the offline sign-out", async () => {
    setCacheIdentity(null);
    setPendingSignOut({
      userId: "user-a",
      sessionId: "session-1",
      isServerEnded: false,
    });
    tab.userId = "user-a";
    tab.sessionId = "session-2";
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
