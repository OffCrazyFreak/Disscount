import { http, HttpResponse } from "msw/http";
import { describe, expect, it, onTestFinished, vi } from "vitest";

import apiClient from "@/lib/api/api-base";
import { authClient } from "@/lib/auth/client";
import { proxyProblem } from "@/lib/backend-proxy/proxy-problem";
import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { server } from "@/test/msw-server";

// Named .tsx only for the jsdom project: the client sends the proxy headers only with a document.

function recordSessionRefetches() {
  const refetches: boolean[] = [];
  onTestFinished(
    authClient.$store.atoms.$sessionSignal.listen((value) =>
      refetches.push(value),
    ),
  );
  return refetches;
}

function recordHeaders() {
  const seen: Headers[] = [];
  server.use(
    http.get("*/api/probe", ({ request }) => {
      seen.push(request.headers);
      return HttpResponse.json({});
    }),
  );
  return seen;
}

describe("apiClient through the backend proxy", () => {
  it("sends the CSRF header, the tab's account and its language, and no token", async () => {
    const seen = recordHeaders();
    setCacheIdentity("user-a");
    document.documentElement.lang = "sl";

    await apiClient.get("/api/probe");

    expect(seen[0].get("X-Disscount-Client")).toBe("web");
    expect(seen[0].get("X-Disscount-User")).toBe("user-a");
    expect(seen[0].get("Accept-Language")).toBe("sl");
    expect(seen[0].get("Authorization")).toBeNull();
  });

  it("pins the identity current when each call starts, not when the client loaded", async () => {
    const seen = recordHeaders();

    await apiClient.get("/api/probe");
    setCacheIdentity("user-b");
    await apiClient.get("/api/probe");

    expect(seen.map((headers) => headers.get("X-Disscount-User"))).toEqual([
      "anon",
      "user-b",
    ]);
  });

  it("refetches the session once when the proxy says the cookie names another account", async () => {
    const refetches = recordSessionRefetches();
    server.use(
      http.get("*/api/probe", ({ request }) =>
        proxyProblem("session_changed", request),
      ),
    );

    await expect(apiClient.get("/api/probe")).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(refetches).toHaveLength(1);
  });

  it("refetches the session once per burst of 401s from Spring, then again after the window", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const refetches = recordSessionRefetches();
    server.use(
      http.get("*/api/probe", () => HttpResponse.json(null, { status: 401 })),
    );

    await Promise.allSettled([
      apiClient.get("/api/probe"),
      apiClient.get("/api/probe"),
      apiClient.get("/api/probe"),
    ]);
    expect(refetches).toHaveLength(1);

    vi.advanceTimersByTime(30_000);
    await expect(apiClient.get("/api/probe")).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(refetches).toHaveLength(2);
  });

  it("leaves the session alone on any other refusal", async () => {
    const refetches = recordSessionRefetches();
    server.use(
      http.get("*/api/probe", () => HttpResponse.json(null, { status: 403 })),
    );

    await expect(apiClient.get("/api/probe")).rejects.toMatchObject({
      response: { status: 403 },
    });

    expect(refetches).toHaveLength(0);
  });
});
