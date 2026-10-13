import { z } from "zod";

// Length only, per NIST SP 800-63B-4: composition rules are out, the breach check does that job.
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

// Schema messages are keys without arguments, so auth.validation.passwordTooShort and
// passwordTooLong repeat these two limits as literals: change them together.
const PASSWORD_TOO_SHORT = "auth.validation.passwordTooShort";
const PASSWORD_TOO_LONG = "auth.validation.passwordTooLong";

// English fallbacks for API clients; the app maps the codes below to translated copy.
export const PASSWORD_BREACHED_MESSAGE =
  "This password appeared in a data breach. Choose another one.";
export const PASSWORD_LENGTH_MESSAGE = `Password must be ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters.`;

// Shared with the client so a server refusal maps to the right copy.
export const PASSWORD_BREACHED = "PASSWORD_BREACHED";
export const PASSWORD_LENGTH_INVALID = "PASSWORD_LENGTH_INVALID";

export function isPasswordPolicyCode(code: unknown): boolean {
  return code === PASSWORD_BREACHED || code === PASSWORD_LENGTH_INVALID;
}

// Counts code points after NFKC, the form scrypt hashes, so an emoji is one character, not two.
function passwordLength(value: string): number {
  return [...value.normalize("NFKC")].length;
}

// Returns a message key for the schema, not text.
export function passwordLengthError(value: string): string | null {
  const length = passwordLength(value);

  if (length < PASSWORD_MIN_LENGTH) return PASSWORD_TOO_SHORT;
  if (length > PASSWORD_MAX_LENGTH) return PASSWORD_TOO_LONG;

  return null;
}

// New passwords only: login must still accept any existing password.
export const passwordSchema = z.string().superRefine((value, ctx) => {
  const message = passwordLengthError(value);
  if (message) ctx.addIssue({ code: "custom", message });
});
