import { IEmailMessage, IEmailProvider } from "@/lib/email/provider";
import {
  buildActionEmail,
  buildCodeEmail,
  type EmailKind,
} from "@/lib/email/email-copy";
import {
  IRecipientSendGate,
  RecipientCapReachedError,
} from "@/lib/email/recipient-send-cap";
import type { AppLocale } from "@/i18n/locales";
import ActionEmail from "@/emails/components/action-email";
import CodeEmail from "@/emails/components/code-email";

interface IActionEmailArgs {
  to: string;
  locale: AppLocale;
  url: string;
  newEmail?: string;
}

interface ITokenEmailArgs extends IActionEmailArgs {
  // Part of the idempotency key, so a retried hook does not send a duplicate.
  token: string;
}

interface ICodeEmailArgs {
  to: string;
  locale: AppLocale;
  code: string;
  // The stored code's row id, so a retried send cannot mail the same code twice.
  codeId: string;
}

interface INoticeEmailArgs extends IActionEmailArgs {
  // One id per security event, so a retried hook cannot mail the same notice twice.
  eventId: string;
}

interface IEmailChangedArgs extends INoticeEmailArgs {
  newEmail: string;
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

  // The provider returns { error }, so surface it; a spent cap throws too, keeping callers enumeration-safe.
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

  private async sendAction(
    kind: EmailKind,
    idempotencyKey: string,
    { to, locale, url, newEmail }: IActionEmailArgs,
  ) {
    const { subject, props } = await buildActionEmail(locale, kind, url, {
      newEmail,
    });

    return this.send({
      to,
      subject,
      react: ActionEmail(props),
      idempotencyKey,
    });
  }

  async sendVerificationEmail(args: ITokenEmailArgs) {
    return this.sendAction("verification", `verify-email/${args.token}`, args);
  }

  async sendPasswordReset(args: ITokenEmailArgs) {
    return this.sendAction(
      "passwordReset",
      `reset-password/${args.token}`,
      args,
    );
  }

  // Same underlying reset token, different wording: for OAuth-only accounts adding a password.
  async sendSetPassword(args: ITokenEmailArgs) {
    return this.sendAction("setPassword", `set-password/${args.token}`, args);
  }

  async sendBreachedPassword(args: ITokenEmailArgs) {
    return this.sendAction(
      "breachedPassword",
      `breached-password/${args.token}`,
      args,
    );
  }

  async sendAccountExists(args: ITokenEmailArgs) {
    return this.sendAction(
      "accountExists",
      `account-exists/${args.token}`,
      args,
    );
  }

  async sendCompleteSignUp(args: ITokenEmailArgs) {
    return this.sendAction(
      "completeSignUp",
      `complete-sign-up/${args.token}`,
      args,
    );
  }

  // Goes to the CURRENT address, so a hijacked session can't move the account.
  async sendChangeEmailConfirmation(args: IChangeEmailArgs) {
    return this.sendAction("changeEmail", `change-email/${args.token}`, args);
  }

  async sendReauthCode({ to, locale, code, codeId }: ICodeEmailArgs) {
    const { subject, props } = await buildCodeEmail(locale, code);

    return this.send({
      to,
      subject,
      react: CodeEmail(props),
      idempotencyKey: `reauth-code/${codeId}`,
    });
  }

  // Security notice after a password change or reset, so a takeover does not go unseen.
  async sendPasswordChanged(args: INoticeEmailArgs) {
    return this.sendAction(
      "passwordChanged",
      `password-changed/${args.eventId}`,
      args,
    );
  }

  // To the old address, the only inbox an owner locked out by a hijacked email change still reads.
  async sendEmailChanged(args: IEmailChangedArgs) {
    return this.sendAction(
      "emailChanged",
      `email-changed/${args.eventId}`,
      args,
    );
  }
}
