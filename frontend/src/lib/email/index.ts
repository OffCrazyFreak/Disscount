import { requireEnv } from "@/lib/env";
import { EmailService } from "./email-service";
import { ResendProvider } from "./resend-provider";

// The only place Resend is wired in. To migrate (e.g. an InfobipProvider implementing
// EmailProvider), swap this line — EmailService and all templates stay unchanged.
const provider = new ResendProvider(
  requireEnv("RESEND_API_KEY"),
  requireEnv("EMAIL_FROM"),
);

export const emailService = new EmailService(provider);
