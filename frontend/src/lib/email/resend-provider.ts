import { Resend } from "resend";

import { EmailMessage, EmailProvider, EmailResult } from "@/lib/email/provider";

// Resend implementation of EmailProvider. The `from` address must exactly match a verified
// Resend domain or the API returns 403.
export class ResendProvider implements EmailProvider {
  private readonly client: Resend;
  private readonly from: string;

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  async send({
    to,
    subject,
    react,
    idempotencyKey,
  }: EmailMessage): Promise<EmailResult> {
    try {
      // The SDK returns { data, error } for API-level errors and renders the React Email
      // template (plus plain-text) from `react` automatically.
      const { data, error } = await this.client.emails.send(
        {
          from: this.from,
          to: [to],
          subject,
          react,
        },
        idempotencyKey ? { idempotencyKey } : undefined,
      );

      if (error) {
        return { id: null, error: error.message };
      }

      return { id: data?.id ?? null, error: null };
    } catch (error) {
      // It can still THROW on transport/network failures - normalize those into an EmailResult
      // so fire-and-forget callers never produce an unhandled rejection.
      return {
        id: null,
        error:
          error instanceof Error ? error.message : "Email transport failed",
      };
    }
  }
}
