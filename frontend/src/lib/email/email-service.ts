import { IEmailMessage, IEmailProvider } from "@/lib/email/provider";
import { buildActionEmail } from "@/lib/email/email-copy";
import type { AppLocale } from "@/i18n/locales";
import VerificationEmail from "@/emails/_templates/verification-email";
import PasswordResetEmail from "@/emails/_templates/password-reset-email";
import SetPasswordEmail from "@/emails/_templates/set-password-email";
import ChangeEmailConfirmation from "@/emails/_templates/change-email-confirmation";
import BreachedPasswordEmail from "@/emails/_templates/breached-password-email";

interface ITokenEmailArgs {
  to: string;
  locale: AppLocale;
  url: string;
  // Used to build an idempotency key so a retried hook doesn't send a duplicate.
  token: string;
}

interface IChangeEmailArgs extends ITokenEmailArgs {
  newEmail: string;
}

// Call sites depend on this, not on Resend, so a provider swap touches only ./index.
export class EmailService {
  constructor(private readonly provider: IEmailProvider) {}

  // Provider returns { error } instead of throwing; surface it so .catch(logEmailFailure) fires.
  private async send(message: IEmailMessage): Promise<void> {
    const { error } = await this.provider.send(message);
    if (error) throw new Error(error);
  }

  async sendVerificationEmail({ to, locale, url, token }: ITokenEmailArgs) {
    const { subject, props } = await buildActionEmail(
      locale,
      "verification",
      url,
    );

    return this.send({
      to,
      subject,
      react: VerificationEmail(props),
      idempotencyKey: `verify-email/${token}`,
    });
  }

  async sendPasswordReset({ to, locale, url, token }: ITokenEmailArgs) {
    const { subject, props } = await buildActionEmail(
      locale,
      "passwordReset",
      url,
    );

    return this.send({
      to,
      subject,
      react: PasswordResetEmail(props),
      idempotencyKey: `reset-password/${token}`,
    });
  }

  // Same underlying reset token, different wording: for OAuth-only accounts adding a password.
  async sendSetPassword({ to, locale, url, token }: ITokenEmailArgs) {
    const { subject, props } = await buildActionEmail(
      locale,
      "setPassword",
      url,
    );

    return this.send({
      to,
      subject,
      react: SetPasswordEmail(props),
      idempotencyKey: `set-password/${token}`,
    });
  }

  // Sent when a correct sign-in is refused because the password is in a known breach.
  sendBreachedPassword({ to, url, token }: ITokenEmailArgs) {
    return this.send({
      to,
      subject: "Tvoja lozinka pronađena je u curenju podataka",
      react: BreachedPasswordEmail({ resetUrl: url }),
      idempotencyKey: `breached-password/${token}`,
    });
  }

  async sendChangeEmailConfirmation({
    to,
    locale,
    url,
    token,
    newEmail,
  }: IChangeEmailArgs) {
    const { subject, props } = await buildActionEmail(
      locale,
      "changeEmail",
      url,
      {
        newEmail,
      },
    );

    return this.send({
      to,
      subject,
      react: ChangeEmailConfirmation(props),
      idempotencyKey: `change-email/${token}`,
    });
  }
}
