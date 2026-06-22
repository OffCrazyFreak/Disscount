import { EmailProvider } from "./provider";
import VerificationEmail from "@/emails/verification-email";
import PasswordResetEmail from "@/emails/password-reset-email";
import ChangeEmailVerification from "@/emails/change-email-verification";

interface TokenEmailArgs {
  to: string;
  url: string;
  token: string;
}

interface ChangeEmailArgs extends TokenEmailArgs {
  newEmail: string;
}

// Provider-agnostic email use cases. Call sites (better-auth hooks, etc.) depend on this,
// not on Resend, so switching providers only touches the wiring in ./index.
export class EmailService {
  constructor(private readonly provider: EmailProvider) {}

  sendVerificationEmail({ to, url, token }: TokenEmailArgs) {
    return this.provider.send({
      to,
      subject: "Potvrdi svoju email adresu",
      react: VerificationEmail({ verificationUrl: url }),
      idempotencyKey: `verify-email/${token}`,
    });
  }

  sendPasswordReset({ to, url, token }: TokenEmailArgs) {
    return this.provider.send({
      to,
      subject: "Ponovno postavljanje lozinke",
      react: PasswordResetEmail({ resetUrl: url }),
      idempotencyKey: `reset-password/${token}`,
    });
  }

  sendChangeEmailVerification({ to, url, token, newEmail }: ChangeEmailArgs) {
    return this.provider.send({
      to,
      subject: "Potvrdi promjenu email adrese",
      react: ChangeEmailVerification({ confirmUrl: url, newEmail }),
      idempotencyKey: `change-email/${token}`,
    });
  }
}
