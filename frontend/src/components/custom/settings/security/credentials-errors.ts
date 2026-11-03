import type { CredentialsFormValues } from "@/components/custom/settings/security/credentials-schema";
import { isPasswordPolicyCode } from "@/lib/auth/password-policy";
import type { IProofFailure } from "@/components/custom/settings/security/reauth/reauth-requests";

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

export function currentPasswordError(failure: IProofFailure): string {
  if (failure.reason === "wrong-password") return CURRENT_PASSWORD_WRONG;
  if (failure.reason === "too-many") return TOO_MANY_ATTEMPTS;
  return "settings.security.submit.changeEmailFailed";
}

export function changeEmailError(
  code: string | undefined,
): ICredentialsFieldError {
  if (code === "social_linked") {
    return { field: "email", message: "settings.security.submit.socialLinked" };
  }

  return { field: "email", message: "settings.security.submit.changeEmailFailed" };
}
