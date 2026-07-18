// Build-time guard: importing this module (which reads RESEND_API_KEY) from any client bundle
// becomes a hard error, so the key can never leak to the browser.
import "server-only";

import { requireEnv } from "@/lib/env";
import { EmailService } from "@/lib/email/email-service";
import { ResendProvider } from "@/lib/email/resend-provider";

// The only place Resend is wired in. To migrate (e.g. an InfobipProvider implementing
// EmailProvider), swap this line - EmailService and all templates stay unchanged.
const provider = new ResendProvider(
  requireEnv("RESEND_API_KEY"),
  requireEnv("EMAIL_FROM"),
);

export const emailService = new EmailService(provider);
