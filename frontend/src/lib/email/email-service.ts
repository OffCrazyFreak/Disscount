import { IEmailMessage, IEmailProvider } from "@/lib/email/provider";
import { buildActionEmail, buildCodeEmail } from "@/lib/email/email-copy";
import {
  IRecipientSendGate,
  RecipientCapReachedError,
} from "@/lib/email/recipient-send-cap";
import type { AppLocale } from "@/i18n/locales";
import VerificationEmail from "@/emails/_templates/verification-email";
import PasswordResetEmail from "@/emails/_templates/password-reset-email";
import SetPasswordEmail from "@/emails/_templates/set-password-email";
import ChangeEmailConfirmation from "@/emails/_templates/change-email-confirmation";
import BreachedPasswordEmail from "@/emails/_templates/breached-password-email";
import AccountExistsEmail from "@/emails/_templates/account-exists-email";
import CompleteSignUpEmail from "@/emails/_templates/complete-sign-up-email";
import ReauthCodeEmail from "@/emails/_templates/reauth-code-email";

interface ITokenEmailArgs {
  to: string;
  locale: AppLocale;
  url: string;
  // Used to build an idempotency key so a retried hook doesn't send a duplicate.
  token: string;
}

interface ICodeEmailArgs {
  to: string;
  locale: AppLocale;
  code: string;
  // The stored code's row id, so a retried send cannot mail the same code twice.
  codeId: string;
}

interface IChangeEmailArgs extends ITokenEmailArgs {
  newEmail: string;
}

// Call sites depend on this, not on Resend, so a provider swap touches only ./index.
export class EmailService {
  constructor(
    private readonly provider: IEmailProvider,
    private readonly recipientGate: IRecipientSendGate,
  ) {}

  // Provider returns { error } instead of throwing; surface it so .catch(logEmailFailure) fires.
  // A spent recipient cap throws the same way, so callers stay silent and enumeration-safe.
  private async send(message: IEmailMessage): Promise<void> {
    if (!(await this.recipientGate.tryReserve(message.to)))
      throw new RecipientCapReachedError();

    const { error } = await this.provider.send(message);
    if (error) {
      // The provider's error is the one worth logging, not a failed give-back.
      await this.recipientGate
        .release(message.to)
        .catch((releaseError: unknown) =>
          console.warn(
            "Failed to release a recipient email slot:",
            releaseError instanceof Error
              ? releaseError.name
              : typeof releaseError,
          ),
        );
      throw new Error(error);
    }
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
  async sendBreachedPassword({ to, locale, url, token }: ITokenEmailArgs) {
    const { subject, props } = await buildActionEmail(
      locale,
      "breachedPassword",
      url,
    );

    return this.send({
      to,
      subject,
      react: BreachedPasswordEmail(props),
      idempotencyKey: `breached-password/${token}`,
    });
  }

  // Sent to a verified owner when someone signs up with their address; links to sign-in.
  async sendAccountExists({ to, locale, url, token }: ITokenEmailArgs) {
    const { subject, props } = await buildActionEmail(
      locale,
      "accountExists",
      url,
    );

    return this.send({
      to,
      subject,
      react: AccountExistsEmail(props),
      idempotencyKey: `account-exists/${token}`,
    });
  }

  // Sent to an unverified owner on a repeat sign-up: a reset token worded as finishing sign-up.
  async sendCompleteSignUp({ to, locale, url, token }: ITokenEmailArgs) {
    const { subject, props } = await buildActionEmail(
      locale,
      "completeSignUp",
      url,
    );

    return this.send({
      to,
      subject,
      react: CompleteSignUpEmail(props),
      idempotencyKey: `complete-sign-up/${token}`,
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

  // A one-time code that proves it is still the owner before a sensitive change.
  async sendReauthCode({ to, locale, code, codeId }: ICodeEmailArgs) {
    const { subject, props } = await buildCodeEmail(locale, code);

    return this.send({
      to,
      subject,
      react: ReauthCodeEmail(props),
      idempotencyKey: `reauth-code/${codeId}`,
    });
  }
}
