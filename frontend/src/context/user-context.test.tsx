import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it, vi } from "vitest";

import { UserProvider } from "@/context/user-context";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

const { session } = vi.hoisted(() => ({
  session: { userId: "user-a" },
}));

// Only useSession is faked; the token request stays real so MSW answers it.
vi.mock("@/lib/auth/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/client")>();
  return {
    authClient: actual.authClient,
    useSession: () => ({
      data: { user: { id: session.userId } },
      isPending: false,
      error: null,
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

    await waitFor(() => expect(authorizations).toContain(`Bearer ${tokenB}`));
    expect(authorizations).not.toContain(`Bearer ${tokenA}`);
  });
});
