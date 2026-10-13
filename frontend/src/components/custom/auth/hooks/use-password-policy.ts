import { useTranslations } from "next-intl";

import {
  PASSWORD_BREACHED,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/auth/password-policy";

const limits = { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH };

// Server refusals carry a stable code; the text shown is always the user's own language.
export function usePasswordPolicy() {
  const t = useTranslations("auth");

  function messageForCode(code: unknown): string {
    return code === PASSWORD_BREACHED
      ? t("errors.passwordBreached")
      : t("errors.passwordLengthInvalid", limits);
  }

  return { hint: t("passwordHint", limits), messageForCode };
}
