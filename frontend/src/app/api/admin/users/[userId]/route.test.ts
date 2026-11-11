import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  proxyToBackend: vi.fn(),
  deleteErasedIdentity: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/lib/backend-proxy/proxy-to-backend", () => ({
  proxyToBackend: mocks.proxyToBackend,
}));
vi.mock("@/lib/auth/delete-erased-identity", () => ({
  deleteErasedIdentity: mocks.deleteErasedIdentity,
}));
vi.mock("@sentry/nextjs", () => ({ captureException: mocks.captureException }));

const { DELETE, PATCH } = await import("@/app/api/admin/users/[userId]/route");

const TARGET_ID = "7f1c2d3e-4b5a-4c6d-8e9f-0a1b2c3d4e5f";
const URL = `http://localhost/api/admin/users/${TARGET_ID}`;

function context(userId = TARGET_ID) {
  return { params: Promise.resolve({ userId }) };
}

function springAnswers(status: number, body: unknown) {
  mocks.proxyToBackend.mockResolvedValue(Response.json(body, { status }));
}

describe("DELETE /api/admin/users/[userId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteErasedIdentity.mockResolvedValue(undefined);
  });

  it("deletes the login after Spring erased the app data", async () => {
    springAnswers(200, { message: "User deleted successfully" });

    const response = await DELETE(
      new Request(URL, { method: "DELETE" }),
      context(),
    );

    expect(response.status).toBe(200);
    expect(mocks.proxyToBackend).toHaveBeenCalledWith(expect.any(Request), [
      "admin",
      "users",
      TARGET_ID,
    ]);
    expect(mocks.deleteErasedIdentity).toHaveBeenCalledExactlyOnceWith(
      TARGET_ID,
    );
  });

  it.each([
    [403, { code: "forbidden" }],
    [400, { code: "error.user.cannotDeleteSelf" }],
    [409, { code: "error.user.lastAdminDelete" }],
    [504, { code: "backend_timeout" }],
  ])("keeps the login when Spring answers %i", async (status, body) => {
    springAnswers(status, body);

    const response = await DELETE(
      new Request(URL, { method: "DELETE" }),
      context(),
    );

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual(body);
    expect(mocks.deleteErasedIdentity).not.toHaveBeenCalled();
  });

  it("reports a failed login delete after the erase, so the admin sees an error and can retry", async () => {
    springAnswers(200, { message: "User deleted successfully" });
    mocks.deleteErasedIdentity.mockRejectedValue(new Error("connection reset"));

    const response = await DELETE(
      new Request(URL, { method: "DELETE" }),
      context(),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "auth_unavailable" });
    expect(mocks.captureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { flow: "admin-user-delete" },
      extra: { targetUserId: TARGET_ID },
    });
  });

  it("refuses an id that is not a uuid before anything runs", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/admin/users/x", { method: "DELETE" }),
      context("x"),
    );

    expect(response.status).toBe(400);
    expect(mocks.proxyToBackend).not.toHaveBeenCalled();
    expect(mocks.deleteErasedIdentity).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/admin/users/[userId]", () => {
  it("still reaches Spring, as this file shadows the catch-all for the whole path", async () => {
    springAnswers(200, { id: TARGET_ID });

    const response = await PATCH(
      new Request(URL, { method: "PATCH" }),
      context(),
    );

    expect(response.status).toBe(200);
    expect(mocks.proxyToBackend).toHaveBeenCalledWith(expect.any(Request), [
      "admin",
      "users",
      TARGET_ID,
    ]);
    expect(mocks.deleteErasedIdentity).not.toHaveBeenCalled();
  });
});
