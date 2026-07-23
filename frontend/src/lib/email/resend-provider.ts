import { Resend } from "resend";

import {
  IEmailMessage,
  IEmailProvider,
  IEmailResult,
} from "@/lib/email/provider";

// `from` must exactly match a verified Resend domain or the API returns 403.
export class ResendProvider implements IEmailProvider {
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
  }: IEmailMessage): Promise<IEmailResult> {
    try {
      // The SDK returns { data, error } for API-level errors rather than throwing,
      // and renders the React Email template (plus plain text) from `react` automatically.
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
      // Transport failures still throw, so normalize them for fire-and-forget callers.
      return {
        id: null,
        error:
          error instanceof Error ? error.message : "Email transport failed",
      };
    }
  }
}
