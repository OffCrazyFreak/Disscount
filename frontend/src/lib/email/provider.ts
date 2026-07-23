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

// Service and templates depend only on this, so the sender swaps in one file.
export interface IEmailProvider {
  send(message: IEmailMessage): Promise<IEmailResult>;
}
