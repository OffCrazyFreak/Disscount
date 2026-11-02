import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import apiClient, {
  clearAuthToken,
  setAuthTokenUser,
} from "@/lib/api/api-base";
import { server } from "@/test/msw-server";

// Named .tsx only for the jsdom project: the client attaches no token without a window.

function unsignedJwt(payload: object): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=+$/, "");
  return `${encode({ alg: "none" })}.${encode(payload)}.signature`;
}

const cachedToken = unsignedJwt({
  sub: "other-account",
  exp: Math.floor(Date.now() / 1000) + 600,
});

function recordAuthorizations() {
  const authorizations: (string | null)[] = [];
  server.use(
    http.get("*/api/auth/token", () =>
      HttpResponse.json({ token: cachedToken }),
    ),
    http.get("*/api/probe", ({ request }) => {
      authorizations.push(request.headers.get("Authorization"));
      return HttpResponse.json({});
    }),
  );
  return authorizations;
}

describe("apiClient bearer token", () => {
  it("attaches the cached token when the caller passes none", async () => {
    const authorizations = recordAuthorizations();

    await apiClient.get("/api/probe");

    expect(authorizations).toEqual([`Bearer ${cachedToken}`]);
  });

  it("keeps a token the caller passed even while a fresh one is cached", async () => {
    const authorizations = recordAuthorizations();
    await apiClient.get("/api/probe");

    await apiClient.get("/api/probe", {
      headers: { Authorization: "Bearer pinned-token" },
    });

    expect(authorizations).toEqual([
      `Bearer ${cachedToken}`,
      "Bearer pinned-token",
    ]);
  });

  it("keeps a caller's token whatever the header's casing", async () => {
    const authorizations = recordAuthorizations();
    await apiClient.get("/api/probe");

    await apiClient.get("/api/probe", {
      headers: { authorization: "Bearer pinned-token" },
    });

    expect(authorizations.at(-1)).toBe("Bearer pinned-token");
  });

  it("never swaps a caller's token for a fresh one after a 401", async () => {
    const authorizations: (string | null)[] = [];
    server.use(
      http.get("*/api/auth/token", () =>
        HttpResponse.json({ token: cachedToken }),
      ),
      http.delete("*/api/probe", ({ request }) => {
        authorizations.push(request.headers.get("Authorization"));
        return HttpResponse.json(null, { status: 401 });
      }),
    );

    await expect(
      apiClient.delete("/api/probe", {
        headers: { Authorization: "Bearer pinned-token" },
      }),
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(authorizations).toEqual(["Bearer pinned-token"]);
  });

  it("does not cache a token whose fetch was in flight when the cache was cleared", async () => {
    let releaseToken: () => void = () => {};
    const tokenHeld = new Promise<void>((resolve) => {
      releaseToken = resolve;
    });
    const authorizations = recordAuthorizations();
    server.use(
      http.get("*/api/auth/token", async () => {
        await tokenHeld;
        return HttpResponse.json({ token: cachedToken });
      }),
    );

    const requestDuringClear = apiClient.get("/api/probe");
    await new Promise((resolve) => setTimeout(resolve, 0));
    clearAuthToken();
    releaseToken();
    await requestDuringClear;
    await apiClient.get("/api/probe");

    expect(authorizations).toEqual([null, null]);
  });

  it("keeps a token whose fetch was in flight when the session named its user", async () => {
    let releaseToken: () => void = () => {};
    const tokenHeld = new Promise<void>((resolve) => {
      releaseToken = resolve;
    });
    const sessionToken = unsignedJwt({
      sub: "user-1",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const authorizations = recordAuthorizations();
    server.use(
      http.get("*/api/auth/token", async () => {
        await tokenHeld;
        return HttpResponse.json({ token: sessionToken });
      }),
    );

    const requestDuringSessionLoad = apiClient.get("/api/probe");
    await new Promise((resolve) => setTimeout(resolve, 0));
    setAuthTokenUser("user-1");
    releaseToken();
    await requestDuringSessionLoad;

    expect(authorizations).toEqual([`Bearer ${sessionToken}`]);
  });
});
