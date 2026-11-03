import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  signUpEmail: vi.fn(async () => ({})),
  requestPasswordReset: vi.fn(async () => ({})),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signUpEmail: mocks.signUpEmail,
      requestPasswordReset: mocks.requestPasswordReset,
    },
  },
}));

vi.mock("@/lib/auth/password-rejection", () => ({
  rejectUnacceptablePassword: async () => null,
}));

// Every lookup finds an account, so a route that branches on existence would take that branch.
vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => [{ id: "user-1" }] }),
      }),
    }),
  },
}));

vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");

const { POST } = await import("@/app/api/account/register/route");

function register(email: string) {
  return POST(
    new Request("http://localhost/api/account/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "correct horse battery",
        locale: "en",
      }),
    }),
  );
}

describe("POST /api/account/register", () => {
  it("signs up a registered address too, so its owner is mailed by better-auth, not a reset request", async () => {
    const response = await register("Person@Example.com");

    expect(await response.json()).toEqual({ status: true });
    expect(mocks.signUpEmail).toHaveBeenCalledWith({
      body: expect.objectContaining({
        email: "person@example.com",
        locale: "en",
        callbackURL: "/en?modal=email-verified",
      }),
    });
    expect(mocks.requestPasswordReset).not.toHaveBeenCalled();
  });

  it("answers the same when better-auth fails", async () => {
    mocks.signUpEmail.mockRejectedValueOnce(new Error("db down"));
    vi.spyOn(console, "error").mockImplementationOnce(() => {});

    const response = await register("person@example.com");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: true });
  });
});
