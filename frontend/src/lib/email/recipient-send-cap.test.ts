import { describe, expect, it, vi } from "vitest";

import {
  hasRecipientBudget,
  inboxKey,
  RECIPIENT_SENDS_PER_DAY,
  RECIPIENT_SENDS_PER_HOUR,
  RecipientCapReachedError,
} from "@/lib/email/recipient-send-cap";
import { EmailService } from "@/lib/email/email-service";
import type { IEmailProvider } from "@/lib/email/provider";

describe("hasRecipientBudget", () => {
  it("allows three sends an hour and ten a day", () => {
    expect(RECIPIENT_SENDS_PER_HOUR).toBe(3);
    expect(RECIPIENT_SENDS_PER_DAY).toBe(10);
  });

  it("refuses the fourth send within an hour", () => {
    expect(hasRecipientBudget({ lastHour: 2, lastDay: 2 })).toBe(true);
    expect(hasRecipientBudget({ lastHour: 3, lastDay: 3 })).toBe(false);
  });

  it("refuses the eleventh send within a day even when the hour is quiet", () => {
    expect(hasRecipientBudget({ lastHour: 0, lastDay: 9 })).toBe(true);
    expect(hasRecipientBudget({ lastHour: 0, lastDay: 10 })).toBe(false);
  });
});

describe("inboxKey", () => {
  it("shares one budget across plus tags and letter case", () => {
    expect(inboxKey(" Victim+1@Example.com ")).toBe("victim@example.com");
    expect(inboxKey("victim+2@example.com")).toBe("victim@example.com");
  });

  it("ignores dots in Gmail local parts, where they reach the same inbox", () => {
    expect(inboxKey("v.i.c.t.i.m@gmail.com")).toBe("victim@gmail.com");
    expect(inboxKey("v.ictim+x@googlemail.com")).toBe("victim@googlemail.com");
  });

  it("keeps dots for other providers", () => {
    expect(inboxKey("first.last@example.com")).toBe("first.last@example.com");
  });
});

describe("EmailService recipient cap", () => {
  const email = {
    to: "victim@example.com",
    locale: "hr" as const,
    url: "https://disscount.me/verify",
    token: "token",
  };

  function serviceWith(allowed: boolean) {
    const provider: IEmailProvider = {
      send: vi.fn().mockResolvedValue({ id: "1", error: null }),
    };
    const gate = { tryReserve: vi.fn().mockResolvedValue(allowed) };

    return { provider, gate, service: new EmailService(provider, gate) };
  }

  it("hands the email to the provider while the recipient has budget", async () => {
    const { provider, gate, service } = serviceWith(true);

    await service.sendVerificationEmail(email);

    expect(gate.tryReserve).toHaveBeenCalledWith("victim@example.com");
    expect(provider.send).toHaveBeenCalledOnce();
  });

  it("never reaches the provider once the recipient's cap is spent", async () => {
    const { provider, service } = serviceWith(false);

    await expect(service.sendVerificationEmail(email)).rejects.toBeInstanceOf(
      RecipientCapReachedError,
    );
    expect(provider.send).not.toHaveBeenCalled();
  });
});
