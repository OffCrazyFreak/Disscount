import { Resend } from "resend";

import {
  IEmailMessage,
  IEmailProvider,
  IEmailResult,
} from "@/lib/email/provider";

// The breached-password sign-in awaits this inside the request, so a stalled Resend call must not hold it open.
const SEND_TIMEOUT_MS = 10_000;

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
      // The SDK returns { data, error } for API errors, and renders the template and text from `react`.
      const { data, error } = await this.client.emails.send(
        {
          from: this.from,
          to: [to],
          subject,
          react,
        },
        { idempotencyKey, signal: AbortSignal.timeout(SEND_TIMEOUT_MS) },
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
