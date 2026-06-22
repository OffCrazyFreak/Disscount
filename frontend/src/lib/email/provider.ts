import { ReactElement } from "react";

export interface EmailMessage {
  to: string;
  subject: string;
  react: ReactElement;
  // Dedupes retries of the same send; providers that don't support it may ignore it.
  idempotencyKey?: string;
}

export interface EmailResult {
  id: string | null;
  error: string | null;
}

// Provider-agnostic email transport. Swap implementations (Resend, Infobip, ...)
// without touching the email service or templates.
export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailResult>;
}
