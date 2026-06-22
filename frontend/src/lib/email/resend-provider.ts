import { Resend } from "resend";

import { EmailMessage, EmailProvider, EmailResult } from "./provider";

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
    // The Resend SDK never throws — it returns { data, error }. It renders the React Email
    // template (and its plain-text alternative) from the `react` field automatically.
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
  }
}
