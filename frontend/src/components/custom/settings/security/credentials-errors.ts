import type { CredentialsFormValues } from "@/components/custom/settings/security/credentials-schema";
import { isPasswordPolicyCode } from "@/lib/auth/password-policy";

const TOO_MANY_ATTEMPTS = "settings.security.submit.tooManyAttempts";
const CURRENT_PASSWORD_WRONG = "settings.security.submit.currentPasswordWrong";

export interface ICredentialsFieldError {
  field: keyof CredentialsFormValues;
  message: string;
}

interface IChangePasswordError {
  code?: string;
  status: number;
}

export function changePasswordError(
  error: IChangePasswordError,
  messageForCode: (code: unknown) => string,
): ICredentialsFieldError {
  if (isPasswordPolicyCode(error.code)) {
    return { field: "newPassword", message: messageForCode(error.code) };
  }

  return {
    field: "currentPassword",
    message:
      error.status === 400
        ? CURRENT_PASSWORD_WRONG
        : "settings.security.submit.changePasswordFailed",
  };
}

export function changeEmailError(
  code: string | undefined,
  afterPasswordChange: boolean,
): ICredentialsFieldError {
  const tooManyAttempts = code === "too_many_attempts";

  // With a password change the check used the new password, so only the email failed.
  if (
    !afterPasswordChange &&
    (tooManyAttempts || code === "invalid_password")
  ) {
    return {
      field: "currentPassword",
      message: tooManyAttempts ? TOO_MANY_ATTEMPTS : CURRENT_PASSWORD_WRONG,
    };
  }

  if (code === "social_linked") {
    return { field: "email", message: "settings.security.submit.socialLinked" };
  }

  return {
    field: "email",
    message: tooManyAttempts
      ? TOO_MANY_ATTEMPTS
      : "settings.security.submit.changeEmailFailed",
  };
}
