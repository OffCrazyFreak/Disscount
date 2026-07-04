import { EmailProvider } from "./provider";
import VerificationEmail from "@/emails/verification-email";
import PasswordResetEmail from "@/emails/password-reset-email";
import SetPasswordEmail from "@/emails/set-password-email";
import ChangeEmailConfirmation from "@/emails/change-email-confirmation";
import { getEmailTranslator } from "@/emails/email-translator";
import type { Locale } from "@/i18n/config";

interface TokenEmailArgs {
  to: string;
  url: string;
  // Used to build an idempotency key so a retried hook doesn't send a duplicate.
  token: string;
  // Recipient's locale, resolved by the caller (getRequestLocale).
  locale: Locale;
}

interface ChangeEmailArgs extends TokenEmailArgs {
  newEmail: string;
}

// Provider-agnostic email use cases. Call sites (Better Auth hooks, the register endpoint)
// depend on this class, not on Resend — switching providers only touches ./index.
export class EmailService {
  constructor(private readonly provider: EmailProvider) {}

  sendVerificationEmail({ to, url, token, locale }: TokenEmailArgs) {
    const t = getEmailTranslator(locale);
    return this.provider.send({
      to,
      subject: t("verify.subject"),
      react: VerificationEmail({ verificationUrl: url, locale }),
      idempotencyKey: `verify-email/${token}`,
    });
  }

  sendPasswordReset({ to, url, token, locale }: TokenEmailArgs) {
    const t = getEmailTranslator(locale);
    return this.provider.send({
      to,
      subject: t("reset.subject"),
      react: PasswordResetEmail({ resetUrl: url, locale }),
      idempotencyKey: `reset-password/${token}`,
    });
  }

  // Same underlying reset token, different wording: for OAuth-only accounts adding a password.
  sendSetPassword({ to, url, token, locale }: TokenEmailArgs) {
    const t = getEmailTranslator(locale);
    return this.provider.send({
      to,
      subject: t("setPassword.subject"),
      react: SetPasswordEmail({ setPasswordUrl: url, locale }),
      idempotencyKey: `set-password/${token}`,
    });
  }

  sendChangeEmailConfirmation({
    to,
    url,
    token,
    newEmail,
    locale,
  }: ChangeEmailArgs) {
    const t = getEmailTranslator(locale);
    return this.provider.send({
      to,
      subject: t("changeEmail.subject"),
      react: ChangeEmailConfirmation({ confirmUrl: url, newEmail, locale }),
      idempotencyKey: `change-email/${token}`,
    });
  }
}
