import { requireEnv } from "@/lib/env";
import { EmailService } from "./email-service";
import { ResendProvider } from "./resend-provider";

// Swap this provider to migrate away from Resend (e.g. an InfobipProvider that implements
// EmailProvider) — the EmailService and templates stay unchanged.
const provider = new ResendProvider(
  requireEnv("RESEND_API_KEY"),
  requireEnv("EMAIL_FROM"),
);

export const emailService = new EmailService(provider);
