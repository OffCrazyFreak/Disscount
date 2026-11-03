import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GenericEndpointContext } from "better-auth";

vi.mock("server-only", () => ({}));
vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://disscount.me");

const sends = vi.hoisted(() => ({
  sendPasswordChanged: vi.fn(async () => {}),
  sendEmailChanged: vi.fn(async () => {}),
}));
vi.mock("@/lib/email", () => ({ emailService: sends }));
vi.mock("@/lib/auth/callbacks", () => ({ logEmailFailure: () => () => {} }));

const { notifyEmailChanged, notifyPasswordChanged } =
  await import("@/lib/auth/security-notifications");

function tokenWith(claims: Record<string, unknown>) {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256" })}.${encode(claims)}.signature`;
}

function verifyEmailContext(token: string) {
  return {
    path: "/verify-email",
    query: { token },
  } as unknown as GenericEndpointContext;
}

beforeEach(() => vi.clearAllMocks());

describe("notifyEmailChanged", () => {
  it("tells the old address once the new one is confirmed", () => {
    const token = tokenWith({
      email: "old@example.com",
      updateTo: "new@example.com",
      requestType: "change-email-verification",
    });

    notifyEmailChanged({ email: "new@example.com" }, verifyEmailContext(token));

    expect(sends.sendEmailChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "old@example.com",
        newEmail: "new@example.com",
      }),
    );
  });

  it("stays quiet for the first step, which only mails the new address", () => {
    const token = tokenWith({
      email: "old@example.com",
      updateTo: "new@example.com",
      requestType: "change-email-confirmation",
    });

    notifyEmailChanged({ email: "old@example.com" }, verifyEmailContext(token));

    expect(sends.sendEmailChanged).not.toHaveBeenCalled();
  });

  it("stays quiet for an ordinary address verification", () => {
    const token = tokenWith({ email: "me@example.com" });

    notifyEmailChanged({ email: "me@example.com" }, verifyEmailContext(token));

    expect(sends.sendEmailChanged).not.toHaveBeenCalled();
  });

  it("ignores user updates outside the verification link", () => {
    notifyEmailChanged({ email: "me@example.com" }, {
      path: "/update-user",
    } as GenericEndpointContext);

    expect(sends.sendEmailChanged).not.toHaveBeenCalled();
  });
});

describe("notifyPasswordChanged", () => {
  it("mails the account's address in its own language", () => {
    notifyPasswordChanged({ email: "me@example.com", locale: "en" } as {
      email: string;
    });

    expect(sends.sendPasswordChanged).toHaveBeenCalledWith(
      expect.objectContaining({ to: "me@example.com", locale: "en" }),
    );
  });
});
