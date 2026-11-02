import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it, vi } from "vitest";

import { UserProvider, useUser } from "@/context/user-context";
import apiClient from "@/lib/api/api-base";
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

    // Both loads that waited on A's token go out bare, then retry with B's after the 401.
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
    recordProfileRequests(() => issueToken());
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

    expect(probeAuthorizations).toEqual([`Bearer ${tokenB}`]);
  });

  it("waits out the cooldown after refusing another account's token instead of fetching on every request", async () => {
    session.userId = "user-b";
    session.error = null;
    let tokenRequests = 0;
    recordProfileRequests(async () => {
      tokenRequests += 1;
      return tokenA;
    });
    server.use(http.get("*/api/probe", () => HttpResponse.json({})));

    renderWithProviders(
      <UserProvider>
        <></>
      </UserProvider>,
    );
    await waitFor(() => expect(tokenRequests).toBeGreaterThan(0));
    await new Promise((resolve) => setTimeout(resolve, 50));
    const tokenRequestsBeforeProbes = tokenRequests;

    await apiClient.get("/api/probe");
    await apiClient.get("/api/probe");
    await apiClient.get("/api/probe");

    expect(tokenRequests).toBe(tokenRequestsBeforeProbes);
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
