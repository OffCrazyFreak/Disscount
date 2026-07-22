import { EmailMessage, EmailProvider } from "@/lib/email/provider";
import VerificationEmail from "@/emails/verification-email";
import PasswordResetEmail from "@/emails/password-reset-email";
import SetPasswordEmail from "@/emails/set-password-email";
import ChangeEmailConfirmation from "@/emails/change-email-confirmation";

interface TokenEmailArgs {
  to: string;
  url: string;
  // Used to build an idempotency key so a retried hook doesn't send a duplicate.
  token: string;
}

interface ChangeEmailArgs extends TokenEmailArgs {
  newEmail: string;
}

// Provider-agnostic email use cases. Call sites (Better Auth hooks, the register endpoint)
// depend on this class, not on Resend - switching providers only touches ./index.
export class EmailService {
  constructor(private readonly provider: EmailProvider) {}

  // Provider returns { error } instead of throwing; surface it so .catch(logEmailFailure) fires.
  private async send(message: EmailMessage): Promise<void> {
    const { error } = await this.provider.send(message);
    if (error) throw new Error(error);
  }

  sendVerificationEmail({ to, url, token }: TokenEmailArgs) {
    return this.send({
      to,
      subject: "Potvrdi svoju email adresu",
      react: VerificationEmail({ verificationUrl: url }),
      idempotencyKey: `verify-email/${token}`,
    });
  }

  sendPasswordReset({ to, url, token }: TokenEmailArgs) {
    return this.send({
      to,
      subject: "Ponovno postavljanje lozinke",
      react: PasswordResetEmail({ resetUrl: url }),
      idempotencyKey: `reset-password/${token}`,
    });
  }

  // Same underlying reset token, different wording: for OAuth-only accounts adding a password.
  sendSetPassword({ to, url, token }: TokenEmailArgs) {
    return this.send({
      to,
      subject: "Postavi lozinku za svoj račun",
      react: SetPasswordEmail({ setPasswordUrl: url }),
      idempotencyKey: `set-password/${token}`,
    });
  }

  sendChangeEmailConfirmation({ to, url, token, newEmail }: ChangeEmailArgs) {
    return this.send({
      to,
      subject: "Potvrdi promjenu email adrese",
      react: ChangeEmailConfirmation({ confirmUrl: url, newEmail }),
      idempotencyKey: `change-email/${token}`,
    });
  }
}
