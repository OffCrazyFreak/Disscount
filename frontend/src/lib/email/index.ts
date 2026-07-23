// Makes importing this (and RESEND_API_KEY) from a client bundle a build error.
import "server-only";

import { requireEnv } from "@/lib/env";
import { EmailService } from "@/lib/email/email-service";
import { ResendProvider } from "@/lib/email/resend-provider";

// The only place Resend is wired in; swapping providers is this line alone.
const provider = new ResendProvider(
  requireEnv("RESEND_API_KEY"),
  requireEnv("EMAIL_FROM"),
);

export const emailService = new EmailService(provider);
