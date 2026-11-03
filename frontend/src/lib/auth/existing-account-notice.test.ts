import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  claimSignUpNotice: vi.fn(),
  claimResetEmail: vi.fn(),
  sendAccountExists: vi.fn(async () => {}),
  sendCompleteSignUp: vi.fn(async () => {}),
  inserted: vi.fn(),
  deleted: vi.fn(),
}));

vi.mock("@/lib/auth/email-link-marker", () => ({
  claimSignUpNotice: mocks.claimSignUpNotice,
  claimResetEmail: mocks.claimResetEmail,
}));

vi.mock("@/lib/email", () => ({
  emailService: {
    sendAccountExists: mocks.sendAccountExists,
    sendCompleteSignUp: mocks.sendCompleteSignUp,
  },
}));

vi.mock("@/db", () => ({
  db: {
    insert: () => ({ values: async (row: unknown) => mocks.inserted(row) }),
    delete: () => ({
      where: async (condition: unknown) => mocks.deleted(condition),
    }),
  },
}));

vi.stubEnv("BETTER_AUTH_URL", "https://disscount.me");

const { notifyExistingAccount } =
  await import("@/lib/auth/existing-account-notice");

function owner(emailVerified: boolean) {
  const now = new Date();
  return {
    id: "user-1",
    email: "person@example.com",
    emailVerified,
    name: "person",
    createdAt: now,
    updatedAt: now,
    locale: "en",
  };
}

describe("notifyExistingAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://disscount.me");
  });

  it("sends nothing within an hour of the last notice", async () => {
    mocks.claimSignUpNotice.mockResolvedValueOnce(null);

    await notifyExistingAccount(owner(true));

    expect(mocks.sendAccountExists).not.toHaveBeenCalled();
    expect(mocks.sendCompleteSignUp).not.toHaveBeenCalled();
  });

  it("points a verified owner at sign-in and mints no reset link", async () => {
    mocks.claimSignUpNotice.mockResolvedValueOnce(async () => {});

    await notifyExistingAccount(owner(true));

    expect(mocks.sendAccountExists).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "person@example.com",
        locale: "en",
        url: "https://disscount.me/en?modal=login",
      }),
    );
    expect(mocks.inserted).not.toHaveBeenCalled();
  });

  it("sends an unverified owner a set-password link the stock reset endpoint accepts", async () => {
    mocks.claimSignUpNotice.mockResolvedValueOnce(async () => {});
    mocks.claimResetEmail.mockResolvedValueOnce(async () => {});

    await notifyExistingAccount(owner(false));

    const [row] = mocks.inserted.mock.calls[0];
    const token = row.identifier.replace("reset-password:", "");
    expect(row.value).toBe("user-1");
    expect(mocks.claimResetEmail).toHaveBeenCalledWith("user-1", token);
    expect(mocks.sendCompleteSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "person@example.com",
        token,
        url: `https://disscount.me/api/auth/reset-password/${token}?callbackURL=${encodeURIComponent("https://disscount.me/en/reset-password")}`,
      }),
    );
  });

  it("gives the hour back when a live reset link already does the job", async () => {
    const releaseNotice = vi.fn(async () => {});
    mocks.claimSignUpNotice.mockResolvedValueOnce(releaseNotice);
    mocks.claimResetEmail.mockResolvedValueOnce(null);

    await notifyExistingAccount(owner(false));

    expect(mocks.sendCompleteSignUp).not.toHaveBeenCalled();
    expect(releaseNotice).toHaveBeenCalledOnce();
    expect(mocks.deleted).toHaveBeenCalledOnce();
  });

  it("undoes both claims and the reset row when the send fails", async () => {
    const releaseNotice = vi.fn(async () => {});
    const releaseReset = vi.fn(async () => {});
    mocks.claimSignUpNotice.mockResolvedValueOnce(releaseNotice);
    mocks.claimResetEmail.mockResolvedValueOnce(releaseReset);
    mocks.sendCompleteSignUp.mockRejectedValueOnce(new Error("capped"));

    await expect(notifyExistingAccount(owner(false))).rejects.toThrow("capped");
    expect(releaseReset).toHaveBeenCalledOnce();
    expect(releaseNotice).toHaveBeenCalledOnce();
    expect(mocks.deleted).toHaveBeenCalledOnce();
  });
});
