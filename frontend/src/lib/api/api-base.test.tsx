import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import apiClient from "@/lib/api/api-base";
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
});
