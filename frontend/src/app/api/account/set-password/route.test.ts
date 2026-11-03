import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("hibp", () => ({ pwnedPassword: vi.fn() }));

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  setPassword: vi.fn(async () => ({ status: true })),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: { getSession: mocks.getSession, setPassword: mocks.setPassword },
  },
}));

const { pwnedPassword } = await import("hibp");
const { POST } = await import("@/app/api/account/set-password/route");

function setPassword(newPassword: string) {
  return POST(
    new Request("http://localhost/api/account/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    }),
  );
}

// setPassword is server-only in better-auth, so no auth hook sees it and this route owns the policy.
describe("POST /api/account/set-password", () => {
  it("refuses a breached password before it is set", async () => {
    mocks.getSession.mockResolvedValue({ session: { createdAt: new Date() } });
    vi.mocked(pwnedPassword).mockResolvedValue(3);

    const response = await setPassword("password1234");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "PASSWORD_BREACHED" });
    expect(mocks.setPassword).not.toHaveBeenCalled();
  });

  it("refuses a short password before it is set", async () => {
    mocks.getSession.mockResolvedValue({ session: { createdAt: new Date() } });

    const response = await setPassword("short");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "PASSWORD_LENGTH_INVALID",
    });
    expect(mocks.setPassword).not.toHaveBeenCalled();
  });

  it("sets an acceptable password", async () => {
    mocks.getSession.mockResolvedValue({ session: { createdAt: new Date() } });
    vi.mocked(pwnedPassword).mockResolvedValue(0);

    const response = await setPassword("correct horse battery staple");

    expect(response.status).toBe(200);
    expect(mocks.setPassword).toHaveBeenCalledExactlyOnceWith({
      body: { newPassword: "correct horse battery staple" },
      headers: expect.any(Headers),
    });
  });
});
