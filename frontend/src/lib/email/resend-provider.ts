import { Resend } from "resend";

import { EmailMessage, EmailProvider, EmailResult } from "./provider";

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
    // The Resend SDK never throws — it returns { data, error }.
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
