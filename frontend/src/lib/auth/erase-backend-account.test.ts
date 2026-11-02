import { delay, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { eraseBackendAccount } =
  await import("@/lib/auth/erase-backend-account");
const { server } = await import("@/test/msw-server");

const USER_ID = "3f2b8c1e-0000-4000-8000-000000000001";

function signedAs(claims: Record<string, unknown>[]) {
  return async (payload: Record<string, unknown>) => {
    claims.push(payload);
    return "erasure-jwt";
  };
}

describe("eraseBackendAccount", () => {
  it("erases with a short-lived purpose token for that user only", async () => {
    const claims: Record<string, unknown>[] = [];
    let authorization: string | null = null;
    server.use(
      http.delete("*/api/users/me", ({ request }) => {
        authorization = request.headers.get("Authorization");
        return HttpResponse.json({ message: "ok" });
      }),
    );

    await eraseBackendAccount(USER_ID, signedAs(claims));

    expect(authorization).toBe("Bearer erasure-jwt");
    expect(claims).toHaveLength(1);
    const [claim] = claims;
    expect(claim).toMatchObject({ sub: USER_ID, purpose: "account-erasure" });
    // No email: the backend would otherwise provision a profile only to erase it.
    expect(claim).not.toHaveProperty("email");
    expect(Number(claim.exp) - Number(claim.iat)).toBeLessThanOrEqual(60);
  });

  it("aborts the deletion when the backend refuses", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.delete("*/api/users/me", () =>
        HttpResponse.json(null, { status: 500 }),
      ),
    );

    await expect(
      eraseBackendAccount(USER_ID, signedAs([])),
    ).rejects.toMatchObject({ statusCode: 500 });
  });

  it("aborts the deletion when the backend cannot be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.delete("*/api/users/me", () => HttpResponse.error()));

    await expect(
      eraseBackendAccount(USER_ID, signedAs([])),
    ).rejects.toMatchObject({ statusCode: 500 });
  });

  it("aborts the deletion when the backend hangs", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(AbortSignal, "timeout").mockImplementation(() =>
      AbortSignal.abort(new DOMException("timed out", "TimeoutError")),
    );
    server.use(
      http.delete("*/api/users/me", async () => {
        await delay("infinite");
        return HttpResponse.json({});
      }),
    );

    await expect(
      eraseBackendAccount(USER_ID, signedAs([])),
    ).rejects.toMatchObject({ statusCode: 500 });
  });
});
