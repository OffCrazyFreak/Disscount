import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  credentialRows: [{ id: "credential-1" }] as { id: string }[],
  sendPasswordReset: vi.fn(async () => {}),
  sendVerificationEmail: vi.fn(async () => {}),
  claimResetEmail: vi.fn(),
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

vi.mock("@/lib/auth/email-link-marker", () => ({
  claimResetEmail: mocks.claimResetEmail,
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
    mocks.claimResetEmail.mockResolvedValueOnce(null);

    await dispatchResetPasswordEmail(...args);

    expect(mocks.claimResetEmail).toHaveBeenCalledWith("user-1", "token-1");
    expect(mocks.sendPasswordReset).not.toHaveBeenCalled();
  });

  it("sends when no other link is live", async () => {
    const release = vi.fn(async () => {});
    mocks.claimResetEmail.mockResolvedValueOnce(release);

    await dispatchResetPasswordEmail(...args);

    expect(mocks.sendPasswordReset).toHaveBeenCalledOnce();
    expect(release).not.toHaveBeenCalled();
  });

  it("releases its claim when the send fails, so the next request can send", async () => {
    const release = vi.fn(async () => {});
    mocks.claimResetEmail.mockResolvedValueOnce(release);
    mocks.sendPasswordReset.mockRejectedValueOnce(new Error("provider down"));

    await expect(dispatchResetPasswordEmail(...args)).rejects.toThrow(
      "provider down",
    );
    expect(release).toHaveBeenCalledOnce();
  });
});

describe("dispatchVerificationEmail", () => {
  it("sends nothing while an earlier verification link is still live", async () => {
    mocks.claimVerificationEmail.mockResolvedValueOnce(null);

    await dispatchVerificationEmail(...args);

    expect(mocks.claimVerificationEmail).toHaveBeenCalledWith(
      "user-1",
      "person@example.com",
      "token-1",
    );
    expect(mocks.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("keeps the send error when the release fails too", async () => {
    mocks.claimVerificationEmail.mockResolvedValueOnce(async () => {
      throw new Error("release failed");
    });
    mocks.sendVerificationEmail.mockRejectedValueOnce(new Error("capped"));

    await expect(dispatchVerificationEmail(...args)).rejects.toThrow("capped");
  });

  it("releases its claim when the send fails", async () => {
    const release = vi.fn(async () => {});
    mocks.claimVerificationEmail.mockResolvedValueOnce(release);
    mocks.sendVerificationEmail.mockRejectedValueOnce(new Error("capped"));

    await expect(dispatchVerificationEmail(...args)).rejects.toThrow("capped");
    expect(release).toHaveBeenCalledOnce();
  });
});
