import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  credentialRows: [{ id: "credential-1" }] as { id: string }[],
  sendPasswordReset: vi.fn(async () => {}),
  sendVerificationEmail: vi.fn(async (_message: { url: string }) => {}),
  claimResetEmail: vi.fn(),
  claimVerificationEmail: vi.fn(),
  updateUser: vi.fn(async (_values: unknown) => {}),
  deleteAccounts: vi.fn(async (_condition: unknown) => {}),
  captureMessage: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({ captureMessage: mocks.captureMessage }));

vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => mocks.credentialRows }),
      }),
    }),
    transaction: async (run: (tx: unknown) => Promise<void>) =>
      run({
        delete: () => ({
          where: async (condition: unknown) => mocks.deleteAccounts(condition),
        }),
        update: () => ({
          set: (values: unknown) => ({
            where: async () => mocks.updateUser(values),
          }),
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

const {
  dispatchResetPasswordEmail,
  dispatchVerificationEmail,
  claimUnverifiedAccountOnReset,
} = await import("@/lib/auth/callbacks");

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
      "token-1",
    );
    expect(mocks.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("sends when no other link is live", async () => {
    mocks.claimVerificationEmail.mockResolvedValueOnce(async () => {});

    await dispatchVerificationEmail(...args);

    expect(mocks.sendVerificationEmail).toHaveBeenCalledOnce();
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

describe("verification link landing", () => {
  const signInLink =
    "https://disscount.me/api/auth/verify-email?token=jwt.part.sig&callbackURL=%2F";

  it("lands a link sent on sign-in on the email-verified modal", async () => {
    mocks.claimVerificationEmail.mockResolvedValueOnce(async () => {});

    await dispatchVerificationEmail(
      "user-1",
      "person@example.com",
      signInLink,
      "token-1",
      "en",
    );

    const [message] = mocks.sendVerificationEmail.mock.calls.at(-1) ?? [];
    const link = new URL(message?.url ?? "");
    expect(link.searchParams.get("callbackURL")).toBe(
      "/en?modal=email-verified",
    );
    expect(link.searchParams.get("token")).toBe("jwt.part.sig");
  });

  it("keeps a callback the caller chose, such as the change-email modal", async () => {
    mocks.claimVerificationEmail.mockResolvedValueOnce(async () => {});
    const changeLink =
      "https://disscount.me/api/auth/verify-email?token=t&callbackURL=%2F%3Fmodal%3Demail-changed";

    await dispatchVerificationEmail(
      "user-1",
      "person@example.com",
      changeLink,
      "token-1",
      "hr",
    );

    expect(mocks.sendVerificationEmail).toHaveBeenLastCalledWith(
      expect.objectContaining({ url: changeLink }),
    );
  });
});

describe("claimUnverifiedAccountOnReset", () => {
  it("drops every social link and verifies the address the reset just proved", async () => {
    mocks.deleteAccounts.mockClear();

    await claimUnverifiedAccountOnReset({ id: "user-1", emailVerified: false });

    const [condition] = mocks.deleteAccounts.mock.calls[0];
    const query = new PgDialect().sqlToQuery(condition as SQL);
    expect(query.sql).toBe(
      '("account"."user_id" = $1 and "account"."provider_id" <> $2)',
    );
    expect(query.params).toEqual(["user-1", "credential"]);
    expect(mocks.updateUser).toHaveBeenCalledWith({ emailVerified: true });
  });

  it("leaves a verified account's links alone", async () => {
    mocks.updateUser.mockClear();
    mocks.deleteAccounts.mockClear();

    await claimUnverifiedAccountOnReset({ id: "user-1", emailVerified: true });

    expect(mocks.deleteAccounts).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  // better-auth revokes the sessions only after this callback returns.
  it("never throws and reports the failure, so the session revocation still runs", async () => {
    mocks.deleteAccounts.mockRejectedValueOnce(new Error("db down"));
    vi.spyOn(console, "error").mockImplementationOnce(() => {});

    await expect(
      claimUnverifiedAccountOnReset({ id: "user-1", emailVerified: false }),
    ).resolves.toBeUndefined();
    expect(mocks.captureMessage).toHaveBeenCalledWith(
      "Account claim after reset failed: Error",
      "error",
    );
  });
});
