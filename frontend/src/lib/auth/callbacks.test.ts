import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  credentialRows: [{ id: "credential-1" }] as { id: string }[],
  sendPasswordReset: vi.fn(async () => {}),
  sendVerificationEmail: vi.fn(async () => {}),
  hasEarlierLiveResetLink: vi.fn(async () => false),
  discardResetLink: vi.fn(async () => {}),
  claimVerificationEmail: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => mocks.credentialRows }),
      }),
    }),
  },
}));

vi.mock("@/lib/email", () => ({
  emailService: {
    sendPasswordReset: mocks.sendPasswordReset,
    sendSetPassword: vi.fn(async () => {}),
    sendVerificationEmail: mocks.sendVerificationEmail,
  },
}));

vi.mock("@/lib/auth/live-reset-link", () => ({
  hasEarlierLiveResetLink: mocks.hasEarlierLiveResetLink,
  discardResetLink: mocks.discardResetLink,
}));

vi.mock("@/lib/auth/verification-email-marker", () => ({
  claimVerificationEmail: mocks.claimVerificationEmail,
}));

const { dispatchResetPasswordEmail, dispatchVerificationEmail } =
  await import("@/lib/auth/callbacks");

const args = [
  "user-1",
  "person@example.com",
  "https://disscount.me/link",
  "token-1",
  "hr",
] as const;

describe("dispatchResetPasswordEmail", () => {
  it("sends nothing while an earlier reset link is still live", async () => {
    mocks.hasEarlierLiveResetLink.mockResolvedValueOnce(true);

    await dispatchResetPasswordEmail(...args);

    expect(mocks.sendPasswordReset).not.toHaveBeenCalled();
    expect(mocks.discardResetLink).toHaveBeenCalledWith("token-1");
  });

  it("sends when no other link is live", async () => {
    await dispatchResetPasswordEmail(...args);

    expect(mocks.sendPasswordReset).toHaveBeenCalledOnce();
    expect(mocks.discardResetLink).not.toHaveBeenCalled();
  });

  it("discards the link when the send fails, so the next request can send", async () => {
    mocks.sendPasswordReset.mockRejectedValueOnce(new Error("provider down"));

    await expect(dispatchResetPasswordEmail(...args)).rejects.toThrow(
      "provider down",
    );
    expect(mocks.discardResetLink).toHaveBeenCalledWith("token-1");
  });
});

describe("dispatchVerificationEmail", () => {
  it("sends nothing while an earlier verification link is still live", async () => {
    mocks.claimVerificationEmail.mockResolvedValueOnce(null);

    await dispatchVerificationEmail(...args);

    expect(mocks.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("releases its claim when the send fails", async () => {
    const release = vi.fn(async () => {});
    mocks.claimVerificationEmail.mockResolvedValueOnce(release);
    mocks.sendVerificationEmail.mockRejectedValueOnce(new Error("capped"));

    await expect(dispatchVerificationEmail(...args)).rejects.toThrow("capped");
    expect(release).toHaveBeenCalledOnce();
  });
});
