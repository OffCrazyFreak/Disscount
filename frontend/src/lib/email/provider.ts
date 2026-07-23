import { ReactElement } from "react";

export interface IEmailMessage {
  to: string;
  subject: string;
  react: ReactElement;
  // Dedupes retries of the same logical send; providers that lack support may ignore it.
  idempotencyKey?: string;
}

export interface IEmailResult {
  id: string | null;
  error: string | null;
}

// Provider-agnostic email transport. The email service and templates depend only on this
// interface, so swapping the sender (Resend now, Infobip later) touches a single file.
export interface IEmailProvider {
  send(message: IEmailMessage): Promise<IEmailResult>;
}
