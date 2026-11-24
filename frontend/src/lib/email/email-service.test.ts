import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import { EmailService } from "@/lib/email/email-service";
import type { IEmailMessage, IEmailProvider } from "@/lib/email/provider";

const TOKEN = "raw-reset-token-abc123";
const TOKEN_HASH = createHash("sha256").update(TOKEN).digest("hex");

const args = {
  to: "person@example.com",
  locale: "hr" as const,
  url: `https://disscount.me/api/auth/reset-password/${TOKEN}`,
  token: TOKEN,
  newEmail: "new@example.com",
};

function recordingService() {
  const sent: IEmailMessage[] = [];

  const provider: IEmailProvider = {
    send: vi.fn(async (message: IEmailMessage) => {
      sent.push(message);

      return { id: "email-id", error: null };
    }),
  };

  const gate = {
    tryReserve: vi.fn().mockResolvedValue(true),
    release: vi.fn().mockResolvedValue(undefined),
  };

  return { sent, service: new EmailService(provider, gate) };
}

const tokenSends = [
  [
    "verify-email",
    (service: EmailService) => service.sendVerificationEmail(args),
  ],
  [
    "reset-password",
    (service: EmailService) => service.sendPasswordReset(args),
  ],
  ["set-password", (service: EmailService) => service.sendSetPassword(args)],
  [
    "breached-password",
    (service: EmailService) => service.sendBreachedPassword(args),
  ],
  [
    "account-exists",
    (service: EmailService) => service.sendAccountExists(args),
  ],
  [
    "complete-sign-up",
    (service: EmailService) => service.sendCompleteSignUp(args),
  ],
  [
    "change-email",
    (service: EmailService) => service.sendChangeEmailConfirmation(args),
  ],
] as const;

describe("EmailService token idempotency keys", () => {
  it.each(tokenSends)(
    "keys the %s email by a hash of the token, never the token itself",
    async (purpose, send) => {
      const { sent, service } = recordingService();

      await send(service);

      const key = sent[0]?.idempotencyKey;

      expect(key).toBe(`${purpose}/${TOKEN_HASH}`);
      expect(key).not.toContain(TOKEN);
    },
  );

  it("gives a retried send for the same token the same key", async () => {
    const { sent, service } = recordingService();

    await service.sendPasswordReset(args);
    await service.sendPasswordReset(args);

    expect(sent[1]?.idempotencyKey).toBe(sent[0]?.idempotencyKey);
  });

  it("gives a different token a different key", async () => {
    const { sent, service } = recordingService();

    await service.sendPasswordReset(args);
    await service.sendPasswordReset({ ...args, token: "another-token" });

    expect(sent[1]?.idempotencyKey).not.toBe(sent[0]?.idempotencyKey);
  });
});
