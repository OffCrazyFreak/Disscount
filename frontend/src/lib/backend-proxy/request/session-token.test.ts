import { APIError } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getToken: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession, getToken: mocks.getToken } },
}));

const { mintSessionToken } =
  await import("@/lib/backend-proxy/request/session-token");

const headers = new Headers({ cookie: "session=user-a" });
const claims = Buffer.from(JSON.stringify({ sub: "user-a" })).toString(
  "base64url",
);
const TOKEN = `header.${claims}.signature`;

beforeEach(() => {
  mocks.getSession.mockReset();
  mocks.getToken.mockReset();
});

describe("mintSessionToken", () => {
  it("throws when the session read fails, so the proxy can answer 503", async () => {
    // What pg-pool raises once connectionTimeoutMillis passes with every connection busy.
    mocks.getSession.mockRejectedValue(
      new Error("timeout exceeded when trying to connect"),
    );

    await expect(mintSessionToken(headers)).rejects.toThrow("timeout exceeded");
    expect(mocks.getToken).not.toHaveBeenCalled();
  });

  it("returns null without signing when there is no session", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(mintSessionToken(headers)).resolves.toBeNull();
    expect(mocks.getToken).not.toHaveBeenCalled();
  });

  it("returns null when getSession refuses the session as signed out", async () => {
    mocks.getSession.mockRejectedValue(
      new APIError("UNAUTHORIZED", { message: "Failed to get session" }),
    );

    await expect(mintSessionToken(headers)).resolves.toBeNull();
    expect(mocks.getToken).not.toHaveBeenCalled();
  });

  it("returns null when the session ends between the read and the signing", async () => {
    mocks.getSession
      .mockResolvedValueOnce({ user: { id: "user-a" } })
      .mockResolvedValueOnce(null);
    mocks.getToken.mockRejectedValue(
      new APIError("UNAUTHORIZED", { message: "Unauthorized" }),
    );

    await expect(mintSessionToken(headers)).resolves.toBeNull();
  });

  it("throws when getToken's own session read failed behind its 401", async () => {
    mocks.getSession
      .mockResolvedValueOnce({ user: { id: "user-a" } })
      .mockRejectedValueOnce(
        new Error("timeout exceeded when trying to connect"),
      );
    mocks.getToken.mockRejectedValue(
      new APIError("UNAUTHORIZED", { message: "Unauthorized" }),
    );

    await expect(mintSessionToken(headers)).rejects.toThrow("timeout exceeded");
  });

  it("throws when getToken answers 401 for a session that still exists", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-a" } });
    mocks.getToken.mockRejectedValue(
      new APIError("UNAUTHORIZED", { message: "Unauthorized" }),
    );

    await expect(mintSessionToken(headers)).rejects.toThrow("Unauthorized");
  });

  it("mints a token naming the session's user", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-a" } });
    mocks.getToken.mockResolvedValue({ token: TOKEN });

    await expect(mintSessionToken(headers)).resolves.toEqual({
      token: TOKEN,
      userId: "user-a",
    });
    expect(mocks.getToken).toHaveBeenCalledWith({ headers });
  });
});
